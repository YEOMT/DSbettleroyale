"""One-time, reviewable setup. Writes only new releaseops files; never reloads Caddy.
Run: python3 tools/deploy/bootstrap.py /home/ubuntu/dsbr-v33 https://staging-host
Then review config/Caddy fragment and supply an exact backup of current Pages files.
"""
import sys,pathlib,json,secrets,subprocess,urllib.request,shutil
from host import atomic,env_values,Host
repo=pathlib.Path(sys.argv[1]).resolve();public=sys.argv[2].rstrip('/')
if not public.startswith('https://') or '/' in public[8:]:raise SystemExit('Exact staging HTTPS origin required')
root=repo/'.releaseops'
if root.exists():raise SystemExit('Existing setup preserved; review it instead of overwriting')
env=repo/'deploy/.env';values=env_values(env);production='https://'+values['PUBLIC_HOST']
if public==production:raise SystemExit('Staging must use a distinct origin')
req=urllib.request.Request('http://127.0.0.1:8080/admin/status',headers={'Authorization':'Bearer '+values['ADMIN_SECRET']})
with urllib.request.urlopen(req,timeout=5) as r:
    if json.load(r)['protectedRooms']:raise SystemExit('DEFERRED: run bootstrap outside active matches')
cid=subprocess.check_output(['docker','compose','--project-name','dsbr-v33','--env-file',str(env),'-f',str(repo/'deploy/compose.yml'),'ps','-q','game'],text=True).strip()
if not cid:raise SystemExit('Existing dsbr-v33 game not found')
running=json.loads(subprocess.check_output(['docker','inspect',cid]))[0]
network=next(iter(running['NetworkSettings']['Networks']))
with urllib.request.urlopen('http://127.0.0.1:8080/version',timeout=5) as r:version=json.load(r)
root.mkdir(mode=0o700);(root/'releases').mkdir()
cfg={'schema':1,'pagesOrigin':'https://yeomt.github.io','pagesUrl':'https://yeomt.github.io/DSbettleroyale/','drainTimeoutSeconds':600,'minFreeBytes':2147483648,'minMemoryBytes':536870912,'maxArchiveBytes':21474836480,'retentionDays':30,'minimumGoodReleases':3}
for target,port,project in [('production',8080,'dsbr-v33'),('staging',8081,'dsbr-staging')]:
    d=root/target;d.mkdir();atomic(d/'admission/state','open' if target=='production' else 'closed')
    (d/'assets').mkdir()
    if target=='production':subprocess.check_call(['docker','cp',cid+':/app/dist/client/assets/.',str(d/'assets')])
    atomic(d/'override.yml',json.dumps({'services':{'game':{'environment':{'DRAIN_ON_START':'${DRAIN_ON_START:-false}','DRAIN_STATE_FILE':'/release-state/state'},'volumes':[str(d/'admission')+':/release-state:ro',str(d/'assets')+':/app/dist/client/assets:ro']}}},indent=2))
    cfg[target]={'project':project,'port':port,'env':str(env if target=='production' else d/'.env'),'compose':str(repo/'deploy/compose.yml' if target=='production' else d/'compose.yml'),'override':str(d/'override.yml'),'public':production if target=='production' else public}
    if target=='staging':
        atomic(d/'.env','\n'.join(['SERVER_IMAGE='+running['Image'],'HOST_AUTH_SECRET='+secrets.token_hex(32),'ADMIN_SECRET='+secrets.token_hex(32),'ALLOWED_ORIGINS='+public,'MAX_ACTIVE_BATTLES=1','MAX_ROOMS=2','NODE_ENV=production'])+'\n')
        atomic(d/'compose.yml',json.dumps({'services':{'game':{'image':'${SERVER_IMAGE:?required}','restart':'unless-stopped','init':True,'env_file':str(d/'.env'),'environment':{'HOST':'0.0.0.0'},'ports':['127.0.0.1:8081:8080'],'mem_limit':'384m','cpus':0.5,'read_only':True,'tmpfs':['/tmp'],'cap_drop':['ALL'],'security_opt':['no-new-privileges:true'],'networks':{'proxy':{'aliases':['dsbr-staging']}},'logging':{'driver':'json-file','options':{'max-size':'5m','max-file':'2'}}}},'networks':{'proxy':{'external':True,'name':network}}},indent=2))
atomic(root/'config.json',json.dumps(cfg,indent=2))
atomic(root/'bootstrap-observed.json',json.dumps({'version':version,'image':running['Config']['Image'],'imageId':running['Image'],'project':'dsbr-v33','persistentImageMatches':values.get('SERVER_IMAGE') in (running['Image'],running['Config']['Image']),'drainOnStart':next((s for s in running['Config']['Env'] if s.startswith('DRAIN_ON_START=')),None)},indent=2))
previous=Host(root,'production').observed() # actual identity, never an empty previous release
subprocess.check_call(['docker','save','-o',str(root/'releases'/previous['releaseId']/'production-previous.tar'),previous['image']])
atomic(root/'Caddy.staging.fragment',public[8:]+' {\n @private path /admin/*\n respond @private 404\n reverse_proxy dsbr-staging:8080\n}\n')
print('BOOTSTRAP_PREPARED: existing env/Caddy/containers unchanged. Review .releaseops/config.json and Caddy.staging.fragment; archive current Pages to .releaseops/pages-current. Add exact Pages origin to production ALLOWED_ORIGINS during approved first transition.')
