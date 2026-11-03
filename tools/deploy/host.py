"""Host transaction adapter; no secret values enter reports. Python 3 + Docker Compose."""
import os, sys, json, pathlib, subprocess, urllib.request, time, hashlib, shutil, re
KEYS=('buildId','contentHash','engineRevision','protocolVersion')
TERMINAL=('DEPLOYED_VERIFIED','ROLLED_BACK','DEFERRED')
def atomic(path,data):
    path=pathlib.Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix('.tmp');tmp.write_text(data);tmp.chmod(0o600);tmp.replace(path)
def read(path):return json.loads(pathlib.Path(path).read_text())
def fingerprint(actual,expected):
    if any(actual.get(k)!=expected.get(k) for k in KEYS):raise RuntimeError('VERSION_MISMATCH')
def sha(path):return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
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
        p,s=self.cfg['production'],self.cfg['staging']
        for k in ('project','port','env','public'):
            if p[k]==s[k]:raise RuntimeError('ENVIRONMENT_COLLISION_'+k)
        if self.env['ADMIN_SECRET']==env_values((s if self.target=='production' else p)['env'])['ADMIN_SECRET']:raise RuntimeError('SHARED_ADMIN_SECRET')
        if self.c['public'] not in self.env['ALLOWED_ORIGINS'].split(','):raise RuntimeError('ORIGIN_NOT_ALLOWED')
        if self.target=='production' and self.cfg['pagesOrigin'] not in self.env['ALLOWED_ORIGINS'].split(','):raise RuntimeError('PAGES_ORIGIN_NOT_ALLOWED')
        if shutil.disk_usage(self.root).free<self.cfg.get('minFreeBytes',2147483648):raise RuntimeError('INSUFFICIENT_DISK')
        size=sum(f.stat().st_size for f in (self.root/'releases').rglob('*') if f.is_file())
        if size>self.cfg.get('maxArchiveBytes',21474836480):raise RuntimeError('ARCHIVE_CAPACITY_BLOCKED: no automatic pruning')
        if os.path.exists('/proc/meminfo'):
            available=int(re.search(r'MemAvailable:\s+(\d+)',pathlib.Path('/proc/meminfo').read_text())[1])*1024
            if available<self.cfg.get('minMemoryBytes',536870912):raise RuntimeError('INSUFFICIENT_MEMORY')
        if self.target=='staging':
            req=urllib.request.Request('http://127.0.0.1:'+str(p['port'])+'/admin/status',headers={'Authorization':'Bearer '+env_values(p['env'])['ADMIN_SECRET']})
            with urllib.request.urlopen(req,timeout=5) as r:
                if json.load(r)['protectedRooms']:raise RuntimeError('DEFERRED_PRODUCTION_MATCH')
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
            staged=read(self.root/'staging'/'transaction.json')
            if staged['release']!=release or staged['phase']!='DEPLOYED_VERIFIED':raise RuntimeError('SUPERSEDED_OR_UNVERIFIED_STAGING')
        if rollback and not (folder/'production-verified.json').exists():raise RuntimeError('ROLLBACK_NOT_PREVIOUSLY_VERIFIED')
        previous=self.observed()
        if self.target=='production' and previous is None:raise RuntimeError('PREVIOUS_PAIR_REQUIRED')
        if self.target=='production' and not (self.root/'pages-current'/'index.html').exists():raise RuntimeError('PREVIOUS_PAGES_REQUIRED')
        self.state={'release':release,'previous':previous,'replaced':False,'pagesMayChange':False,'target':self.target}
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
        image=m['images'][self.target];self.run(['docker','image','inspect',image])
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
            _,m=self.bundle(self.state['release']);image,version=m['images'][self.target],m['fingerprint']
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
        if action not in ('stage','rollback','status') and (not host.state or host.state['release']!=args[0]):raise RuntimeError('TRANSACTION_ID_MISMATCH')
        if action in ('stage','rollback'):host.stage(args[0],action=='rollback')
        elif action=='publishing':host.publishing()
        elif action=='commit':host.finish()
        elif action=='verified':host.verified()
        elif action=='restore':host.restore()
        elif action=='finish-rollback':host.finish(True)
        elif action=='rollback-failed':host.save('ROLLBACK_FAILED')
        elif action=='status':print(json.dumps(host.state))
        else:raise RuntimeError('INVALID_ACTION')
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('RELEASE_FAILED: '+str(e).splitlines()[0],file=sys.stderr);sys.exit(1)
