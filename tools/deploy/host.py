"""Host transaction adapter; no secret values enter reports. Python 3 + Docker Compose."""
import os, sys, json, pathlib, subprocess, urllib.request, time, hashlib, shutil, re, tarfile
KEYS=('buildId','contentHash','engineRevision','protocolVersion')
TERMINAL=('DEPLOYED_VERIFIED','ROLLED_BACK','DEFERRED')
def atomic(path,data):
    path=pathlib.Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix('.tmp');tmp.write_text(data);tmp.chmod(0o600);tmp.replace(path)
def read(path):return json.loads(pathlib.Path(path).read_text())
def fingerprint(actual,expected):
    if any(actual.get(k)!=expected.get(k) for k in KEYS):raise RuntimeError('VERSION_MISMATCH')
def sha(path):
    digest=hashlib.sha256()
    with open(path,'rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):digest.update(chunk)
    return digest.hexdigest()
def saved_oci_identity(archive,expected):
    """Resolve a sealed config ID to its hashed OCI manifest, never a mutable tag."""
    if not re.fullmatch('sha256:[a-f0-9]{64}',expected):raise RuntimeError('INVALID_IMAGE_DIGEST')
    with tarfile.open(archive) as saved:
        def data(name):
            member=saved.getmember(name)
            if not member.isfile() or member.size>2097152:raise RuntimeError('INVALID_IMAGE_METADATA')
            return saved.extractfile(member).read()
        def blob(digest):
            if not re.fullmatch('sha256:[a-f0-9]{64}',digest):raise RuntimeError('INVALID_IMAGE_DIGEST')
            raw=data('blobs/sha256/'+digest[7:])
            if 'sha256:'+hashlib.sha256(raw).hexdigest()!=digest:raise RuntimeError('IMAGE_METADATA_CHECKSUM')
            return json.loads(raw),len(raw)
        config,_=blob(expected);index=json.loads(data('index.json'));matches=[]
        if index.get('schemaVersion')!=2:raise RuntimeError('INVALID_IMAGE_INDEX')
        for descriptor in index.get('manifests',[]):
            if descriptor.get('mediaType') not in ('application/vnd.oci.image.manifest.v1+json','application/vnd.docker.distribution.manifest.v2+json'):continue
            manifest,size=blob(descriptor['digest'])
            if descriptor.get('size')!=size:raise RuntimeError('IMAGE_METADATA_SIZE')
            if manifest.get('schemaVersion')==2 and manifest.get('config',{}).get('digest')==expected:matches.append(descriptor['digest'])
        if len(matches)!=1 or config.get('rootfs',{}).get('type')!='layers' or not config.get('os') or not config.get('architecture'):raise RuntimeError('AMBIGUOUS_IMAGE_IDENTITY')
        return {'reference':matches[0],'configDigest':expected,'os':config['os'],'architecture':config['architecture'],'layers':config['rootfs']['diff_ids']}
def env_values(path):
    values={}
    for line in pathlib.Path(path).read_text().splitlines():
        if '=' not in line or line.lstrip().startswith('#'):continue
        key,value=line.split('=',1);value=value.strip()
        if len(value)>1 and value[0]==value[-1] and value[0] in "\"'":value=value[1:-1]
        values[key.strip()]=value
    return values
def persist_env(path,image):
    values={'SERVER_IMAGE':image,'DRAIN_ON_START':'false'};out=[]
    for line in pathlib.Path(path).read_text().splitlines():
        key=line.split('=',1)[0];out.append(key+'='+values.pop(key) if key in values else line)
    out.extend(k+'='+v for k,v in values.items());atomic(path,'\n'.join(out)+'\n')
def memory_status():
    result={'minimumBytes':536870912}
    if os.path.exists('/proc/meminfo'):
        result['availableBytes']=int(re.search(r'MemAvailable:\s+(\d+)',pathlib.Path('/proc/meminfo').read_text())[1])*1024
        result['oomKills']=int(re.search(r'^oom_kill\s+(\d+)',pathlib.Path('/proc/vmstat').read_text(),re.M)[1])
    if os.path.exists('/proc/pressure/memory'):
        result['psi']={line.split()[0]:{k:float(v) for k,v in (item.split('=') for item in line.split()[1:])} for line in pathlib.Path('/proc/pressure/memory').read_text().splitlines()}
    return result
def validate_isolated(receipt,manifest,digest):
    if receipt.get('schema')!=1 or receipt.get('kind')!='github-actions-isolated-docker' or receipt.get('status')!='PASS' or receipt.get('oomKilled') is not False or receipt.get('verifiedWorkflow')!='.github/workflows/promote.yml':raise RuntimeError('UNTRUSTED_ISOLATED_RECEIPT')
    if receipt.get('releaseId')!=manifest['releaseId'] or receipt.get('manifestSha256')!=digest or receipt.get('imageId')!=manifest['images']['production']:raise RuntimeError('ISOLATED_CANDIDATE_MISMATCH')
    fingerprint(receipt.get('fingerprint',{}),manifest['fingerprint'])
    for key in ('runId','candidateRunId','runAttempt'):
        if not str(receipt.get(key,'')).isdigit() or int(receipt[key])<1:raise RuntimeError('INVALID_VALIDATION_RUN')
    if not re.fullmatch('[a-f0-9]{40}',receipt.get('toolsSha','')):raise RuntimeError('INVALID_VALIDATION_SOURCE')
    for name in ('bundle','image','http-version','origins','lifecycle-controls'):
        if sum(c.get('name')==name and c.get('status')=='PASS' for c in receipt.get('checks',[]))!=1:raise RuntimeError('INCOMPLETE_ISOLATED_CHECKS')
    for name in ('lobby','quiz','draft','move','attack','skill','resume','resumeMove','resumeAttack','resumeSkill','results','rematch','closed'):
        if receipt.get('controls',{}).get(name) is not True:raise RuntimeError('INCOMPLETE_CONTROL_CHECKS')
class Host:
    def __init__(self,root,target):
        self.root=pathlib.Path(root).resolve();self.cfg=read(self.root/'config.json');self.target=target
        if target not in ('staging','production'):raise RuntimeError('INVALID_TARGET')
        self.c=self.cfg[target];self.dir=self.root/target;self.dir.mkdir(exist_ok=True)
        self.statefile=self.dir/'transaction.json';self.admission=self.dir/'admission'/'state'
        self.state=read(self.statefile) if self.statefile.exists() else None
        self.env=env_values(self.c['env']);self.base='http://127.0.0.1:'+str(self.c['port'])
    def run(self,args,**kw):return subprocess.check_output(args,text=True,timeout=kw.pop('timeout',120),stderr=subprocess.PIPE,**kw).strip()
    def save(self,phase):
        self.state['phase']=phase;self.state['updated']=int(time.time());atomic(self.statefile,json.dumps(self.state,indent=2));print(phase,flush=True)
    def api(self,path,post=False):
        req=urllib.request.Request(self.base+path,method='POST' if post else 'GET',headers={'Authorization':'Bearer '+self.env['ADMIN_SECRET']})
        with urllib.request.urlopen(req,timeout=5) as r:return json.load(r)
    def compose(self,*args,image=None,drain=None):
        return self.run(['docker','compose','--project-name',self.c['project'],'--env-file',self.c['env'],'-f',self.c['compose'],'-f',self.c['override'],*args],env={**os.environ,**({'SERVER_IMAGE':image} if image else {}),**({'DRAIN_ON_START':str(drain).lower()} if drain is not None else {})})
    def check_config(self):
        if self.target=='staging' and self.cfg.get('validationMode')=='github-actions':raise RuntimeError('COLOCATED_STAGING_DISABLED')
        p,s=self.cfg['production'],self.cfg['staging']
        for k in ('project','port','env','public'):
            if p[k]==s[k]:raise RuntimeError('ENVIRONMENT_COLLISION_'+k)
        if self.env['ADMIN_SECRET']==env_values((s if self.target=='production' else p)['env'])['ADMIN_SECRET']:raise RuntimeError('SHARED_ADMIN_SECRET')
        if self.c['public'] not in self.env['ALLOWED_ORIGINS'].split(','):raise RuntimeError('ORIGIN_NOT_ALLOWED')
        if self.target=='production' and self.cfg['pagesOrigin'] not in self.env['ALLOWED_ORIGINS'].split(','):raise RuntimeError('PAGES_ORIGIN_NOT_ALLOWED')
        if shutil.disk_usage(self.root).free<self.cfg.get('minFreeBytes',2147483648):raise RuntimeError('INSUFFICIENT_DISK')
        size=sum(f.stat().st_size for f in (self.root/'releases').rglob('*') if f.is_file())
        if size>self.cfg.get('maxArchiveBytes',21474836480):raise RuntimeError('ARCHIVE_CAPACITY_BLOCKED: no automatic pruning')
        self.check_memory()
        if self.target=='staging':
            req=urllib.request.Request('http://127.0.0.1:'+str(p['port'])+'/admin/status',headers={'Authorization':'Bearer '+env_values(p['env'])['ADMIN_SECRET']})
            with urllib.request.urlopen(req,timeout=5) as r:
                if json.load(r)['protectedRooms']:raise RuntimeError('DEFERRED_PRODUCTION_MATCH')
    def check_memory(self):
        metrics=memory_status();metrics['minimumBytes']=self.cfg.get('minMemoryBytes',536870912)
        atomic(self.dir/'memory-preflight.json',json.dumps(metrics,indent=2))
        if metrics.get('availableBytes',metrics['minimumBytes'])<metrics['minimumBytes']:raise RuntimeError('INSUFFICIENT_MEMORY')
        return metrics
    def record_validation(self,release,incoming):
        if not re.fullmatch('[a-f0-9]{40}',release):raise RuntimeError('INVALID_RELEASE')
        incoming=pathlib.Path(incoming).resolve()
        if not incoming.is_relative_to((self.root/'incoming').resolve()):raise RuntimeError('INVALID_VALIDATION_PATH')
        manifest=self.root/'releases'/release/'manifest.json';m=read(manifest);receipt=read(incoming)
        if m['releaseId']!=release:raise RuntimeError('ARTIFACT_IDENTITY')
        validate_isolated(receipt,m,sha(manifest));atomic(self.root/'validations'/(release+'.json'),json.dumps(receipt,indent=2))
    def require_validation(self,release,folder,m):
        mode=self.cfg.get('validationMode','staging')
        if mode=='github-actions':
            validate_isolated(read(self.root/'validations'/(release+'.json')),m,sha(folder/'manifest.json'))
        elif mode=='staging':
            staged=read(self.root/'staging'/'transaction.json')
            if staged['release']!=release or staged['phase']!='DEPLOYED_VERIFIED':raise RuntimeError('SUPERSEDED_OR_UNVERIFIED_STAGING')
        else:raise RuntimeError('INVALID_VALIDATION_MODE')
    def backup_settings(self,release):
        folder=self.dir/'backups'/(str(time.time_ns())+'-'+release);folder.mkdir(parents=True,mode=0o700)
        paths={'config.json':self.root/'config.json','environment':pathlib.Path(self.c['env'])}
        for key in ('compose','override'):
            if self.c.get(key):paths[key]=pathlib.Path(self.c[key])
        caddy=self.root.parent/'deploy/Caddyfile'
        if caddy.exists():paths['Caddyfile']=caddy
        for name,p in paths.items():
            if p.exists():dest=folder/name;dest.write_bytes(p.read_bytes());dest.chmod(0o600)
        return str(folder)
    def bundle(self,release):
        if not re.fullmatch('[0-9a-f]{40}',release):raise RuntimeError('INVALID_RELEASE')
        folder=self.root/'releases'/release;m=read(folder/'manifest.json')
        if m['releaseId']!=release or m['sourceSha']!=release:raise RuntimeError('ARTIFACT_IDENTITY')
        for f,digest in m['checksums'].items():
            path=(folder/f).resolve()
            if not path.is_relative_to(folder.resolve()) or sha(path)!=digest:raise RuntimeError('ARTIFACT_CHECKSUM')
        if m.get('sourceDirty') or m['checks']['status']!='PASS':raise RuntimeError('REQUIRED_CHECKS_NOT_PASSED')
        if m['targets'][self.target]['http']!=self.c['public']:raise RuntimeError('PUBLIC_CONFIG_MISMATCH')
        return folder,m
    def observed(self):
        cid=self.compose('ps','-q','game')
        if not cid:return None
        d=json.loads(self.run(['docker','inspect',cid]))[0]
        if d['Config']['Labels']['com.docker.compose.project']!=self.c['project']:raise RuntimeError('WRONG_PROJECT')
        version=self.api('/version');image=d['Image'];release=version['buildId']
        if not re.fullmatch('[0-9a-f]{40}',release):raise RuntimeError('PREVIOUS_SHA_REQUIRED')
        folder=self.root/'releases'/release;folder.mkdir(parents=True,exist_ok=True)
        return {'releaseId':release,'image':image,'version':version}
    def resolve_image(self,folder,manifest):
        expected=manifest['images'][self.target]
        try:
            self.run(['docker','image','inspect',expected]);return expected
        except subprocess.CalledProcessError:
            # Docker 29 containerd reports OCI manifest IDs; classic stores use config IDs.
            # bundle() already verified the entire saved archive against the sealed manifest.
            identity=saved_oci_identity(folder/(self.target+'-image.tar'),expected)
            loaded=json.loads(self.run(['docker','image','inspect',identity['reference']]))
            if len(loaded)!=1:raise RuntimeError('IMAGE_IDENTITY_MISMATCH')
            image=loaded[0]
            if image.get('Id')!=identity['reference'] or image.get('Os')!=identity['os'] or image.get('Architecture')!=identity['architecture'] or image.get('RootFS',{}).get('Layers')!=identity['layers']:raise RuntimeError('IMAGE_IDENTITY_MISMATCH')
            return identity['reference']
    def verify(self,version):
        for attempt in range(30):
            try:
                if not self.api('/healthz')['ok']:raise RuntimeError('UNHEALTHY')
                fingerprint(self.api('/version'),version);return
            except Exception:
                if attempt==29:raise
                time.sleep(1)
    def apply(self,image):
        atomic(self.admission,'closed');self.compose('up','-d','--no-deps','game',image=image,drain=True)
    def drain(self):
        self.save('WAITING_FOR_MATCH_END');atomic(self.admission,'closed');self.api('/admin/drain',True)
        deadline=time.monotonic()+self.cfg.get('drainTimeoutSeconds',600)
        while time.monotonic()<deadline:
            if self.api('/admin/status')['protectedRooms']==0:self.api('/admin/seal',True);return
            time.sleep(2)
        atomic(self.admission,'open');self.api('/admin/undrain',True);self.save('DEFERRED');raise RuntimeError('DRAIN_TIMEOUT')
    def stage(self,release,rollback=False):
        if self.state and self.state['phase'] not in TERMINAL:raise RuntimeError('RECOVERY_REQUIRED')
        self.check_config();folder,m=self.bundle(release)
        if self.target=='production' and not rollback:
            self.require_validation(release,folder,m)
        if rollback and not (folder/'production-verified.json').exists():raise RuntimeError('ROLLBACK_NOT_PREVIOUSLY_VERIFIED')
        previous=self.observed()
        if self.target=='production' and previous is None:raise RuntimeError('PREVIOUS_PAIR_REQUIRED')
        if self.target=='production' and not (self.root/'pages-current'/'index.html').exists():raise RuntimeError('PREVIOUS_PAGES_REQUIRED')
        self.state={'release':release,'previous':previous,'replaced':False,'pagesMayChange':False,'target':self.target,'settingsBackup':self.backup_settings(release)}
        self.save('PREPARING')
        if self.target=='production':
            backup=self.dir/'pages-previous'
            if backup.exists():shutil.rmtree(backup)
            shutil.copytree(self.root/'pages-current',backup)
        if previous:self.drain()
        if previous:
            backup=self.root/'releases'/previous['releaseId']/(self.target+'-previous.tar')
            if not backup.exists():self.run(['docker','save','-o',str(backup),previous['image']],timeout=300)
        self.run(['docker','load','-i',str(folder/(self.target+'-image.tar'))],timeout=300)
        image=self.resolve_image(folder,m);self.state['imageReference']=image
        self.check_memory() # image preparation may change available memory; do not relax the original bound
        assets=self.dir/'assets';assets.mkdir(exist_ok=True)
        shutil.copytree(folder/self.target/'client/assets',assets,dirs_exist_ok=True)
        if self.target=='production':
            publish=self.dir/'pages-publish'
            if publish.exists():shutil.rmtree(publish)
            shutil.copytree(folder/'pages',publish)
            old=self.root/'pages-current/assets'
            if old.exists():
                for f in old.iterdir():
                    if f.is_file() and not (publish/'assets'/f.name).exists():shutil.copy2(f,publish/'assets'/f.name)
        self.state['replaced']=True;self.save('REPLACING');self.apply(image)
        self.verify(m['fingerprint']);self.save('SERVER_STAGED_DRAINED')
    def publishing(self):
        if self.state['phase']!='SERVER_STAGED_DRAINED':raise RuntimeError('INVALID_PHASE')
        self.state['pagesMayChange']=True;self.save('PUBLISHING_PAGES')
    def finish(self,rollback=False):
        if rollback:
            if self.state['phase']!='ROLLBACK_STAGED':raise RuntimeError('INVALID_PHASE')
            p=self.state['previous']
            if p is None:self.save('ROLLED_BACK');return
            image,version=p['image'],p['version']
        else:
            if self.state['phase'] not in ('SERVER_STAGED_DRAINED','PUBLISHING_PAGES'):raise RuntimeError('INVALID_PHASE')
            folder,m=self.bundle(self.state['release']);image,version=self.resolve_image(folder,m),m['fingerprint']
            if self.state.get('imageReference',image)!=image:raise RuntimeError('IMAGE_IDENTITY_CHANGED')
        self.verify(version)
        # Pair has passed public checks. Remove the temporary startup override too.
        persist_env(self.c['env'],image);self.compose('up','-d','--no-deps','game',image=image,drain=False)
        self.verify(version);atomic(self.admission,'open');self.api('/admin/undrain',True)
        if not rollback and self.target=='production':
            current=self.root/'pages-current'
            if current.exists():shutil.rmtree(current)
            shutil.copytree(self.dir/'pages-publish',current)
        elif rollback and self.target=='production':
            current=self.root/'pages-current'
            if current.exists():shutil.rmtree(current)
            shutil.copytree(self.dir/'pages-previous',current)
        self.save('ROLLED_BACK' if rollback else 'ADMITTED_PENDING_SMOKE')
        atomic(self.dir/('receipt-'+self.state['release']+'.json'),json.dumps(self.state,indent=2))
    def verified(self):
        if self.state['phase']!='ADMITTED_PENDING_SMOKE':raise RuntimeError('INVALID_PHASE')
        if self.target=='production':atomic(self.root/'releases'/self.state['release']/'production-verified.json',json.dumps({'time':int(time.time())}))
        self.save('DEPLOYED_VERIFIED');atomic(self.dir/('receipt-'+self.state['release']+'.json'),json.dumps(self.state,indent=2))
    def restore(self):
        if not self.state or self.state['phase'] in ('DEFERRED','ROLLED_BACK'):return
        if self.state['phase'] in ('DEPLOYED_VERIFIED','ADMITTED_PENDING_SMOKE'):self.drain()
        if not self.state['replaced']:
            atomic(self.admission,'open');self.api('/admin/undrain',True);self.save('ROLLED_BACK');return
        atomic(self.admission,'closed');p=self.state['previous']
        if p:
            self.apply(p['image'])
            try:self.verify(p['version'])
            except Exception:self.save('ROLLBACK_FAILED');raise
        else:self.compose('stop','game')
        self.save('ROLLBACK_STAGED')
def main():
    import fcntl
    root,target,action,*args=sys.argv[1:];root=pathlib.Path(root)
    with open(root/'host.lock','a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB);host=Host(root,target)
        other=root/('production' if target=='staging' else 'staging')/'transaction.json'
        if other.exists() and read(other)['phase'] not in TERMINAL:raise RuntimeError('OTHER_TRANSACTION_ACTIVE')
        if action not in ('stage','rollback','status','preflight','record-validation') and (not host.state or host.state['release']!=args[0]):raise RuntimeError('TRANSACTION_ID_MISMATCH')
        if action in ('stage','rollback'):host.stage(args[0],action=='rollback')
        elif action=='publishing':host.publishing()
        elif action=='commit':host.finish()
        elif action=='verified':host.verified()
        elif action=='restore':host.restore()
        elif action=='finish-rollback':host.finish(True)
        elif action=='rollback-failed':host.save('ROLLBACK_FAILED')
        elif action=='status':print(json.dumps(host.state))
        elif action=='preflight':host.check_config();print(json.dumps(memory_status()))
        elif action=='record-validation':host.record_validation(args[0],args[1])
        else:raise RuntimeError('INVALID_ACTION')
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('RELEASE_FAILED: '+str(e).splitlines()[0],file=sys.stderr);sys.exit(1)
