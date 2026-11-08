import unittest,tempfile,pathlib,sys,json,importlib.util,copy
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('host',pathlib.Path(__file__).resolve().parents[2]/'tools/deploy/host.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
class Fake(h.Host):
    def __init__(self,root):
        self.root=pathlib.Path(root);self.target='production';self.dir=self.root/'production';self.dir.mkdir(exist_ok=True);self.statefile=self.dir/'transaction.json';self.admission=self.dir/'admission/state';self.cfg={'drainTimeoutSeconds':0};self.c={'env':str(self.root/'.env')};h.atomic(self.c['env'],'HOST_AUTH_SECRET=unchanged\nADMIN_SECRET=unchanged-admin\nSERVER_IMAGE=old\nDRAIN_ON_START=true\n');self.calls=[];self.state=None;self.protected=1;self.fail=False
    def api(self,p,post=False):self.calls.append(p);return {'protectedRooms':self.protected,'ok':True}
    def verify(self,v):
        self.calls.append('verify')
        if self.fail:raise RuntimeError('SERVER_FAILED')
    def compose(self,*args,**kw):self.calls.append(('compose',args,kw));return ''
    def check_config(self):pass
    def bundle(self,r):return self.root,{'fingerprint':{'buildId':r},'images':{'production':'new'}}
    def run(self,*args,**kw):return ''
    def observed(self):return {'releaseId':'old','image':'old','version':{'buildId':'old'}}
class Transactions(unittest.TestCase):
    def setUp(self):
        pathlib.Path('artifacts').mkdir(exist_ok=True);self.tmp=tempfile.TemporaryDirectory(dir='artifacts');self.addCleanup(self.tmp.cleanup);self.host=Fake(self.tmp.name)
    def staged(self):
        a=self.host;(a.dir/'pages-previous').mkdir(exist_ok=True);h.atomic(a.dir/'pages-previous/index.html','old pages');a.state={'release':'new','previous':a.observed(),'replaced':True,'pagesMayChange':True};a.save('PUBLISHING_PAGES');return a
    def test_timeout_does_not_replace_or_end_match(self):
        a=self.host;a.state={'replaced':False}
        with self.assertRaisesRegex(RuntimeError,'DRAIN_TIMEOUT'):a.drain()
        self.assertEqual(a.state['phase'],'DEFERRED');self.assertIn('/admin/undrain',a.calls);self.assertFalse(any(isinstance(x,tuple) for x in a.calls));self.assertEqual(a.protected,1)
    def test_pages_failure_restores_server_but_keeps_admission_closed(self):
        a=self.staged();a.restore();self.assertEqual(a.state['phase'],'ROLLBACK_STAGED');self.assertEqual(a.admission.read_text(),'closed');self.assertNotIn('/admin/undrain',a.calls)
        a.finish(True);self.assertEqual(a.admission.read_text(),'open');self.assertEqual(h.env_values(a.c['env'])['DRAIN_ON_START'],'false');self.assertEqual(h.env_values(a.c['env'])['SERVER_IMAGE'],'old')
    def test_rollback_verification_failure_never_undrains(self):
        a=self.staged();a.fail=True
        with self.assertRaisesRegex(RuntimeError,'SERVER_FAILED'):a.restore()
        self.assertNotIn('/admin/undrain',a.calls);self.assertEqual(a.admission.read_text(),'closed')
    def test_interruption_is_persisted_and_new_deploy_refused(self):
        a=self.staged();self.assertEqual(h.read(a.statefile)['phase'],'PUBLISHING_PAGES')
        with self.assertRaisesRegex(RuntimeError,'RECOVERY_REQUIRED'):a.stage('new')
    def test_pre_replace_failure_keeps_old_container(self):
        a=self.host;a.state={'replaced':False};a.save('PREPARING');a.restore();self.assertFalse(any(isinstance(x,tuple) for x in a.calls));self.assertEqual(a.state['phase'],'ROLLED_BACK')
    def test_env_update_preserves_secrets(self):
        a=self.host;h.persist_env(a.c['env'],'sha256:new');v=h.env_values(a.c['env']);self.assertEqual(v['HOST_AUTH_SECRET'],'unchanged');self.assertEqual(v['ADMIN_SECRET'],'unchanged-admin');self.assertEqual(v['DRAIN_ON_START'],'false')
    def test_version_contract_not_relaxed(self):
        v=dict(buildId='old',contentHash='h',engineRevision='e',protocolVersion=33)
        with self.assertRaisesRegex(RuntimeError,'VERSION_MISMATCH'):h.fingerprint({**v,'buildId':'new'},v)
    def test_selected_release_does_not_follow_new_main(self):
        a=self.host;(a.root/'staging').mkdir();h.atomic(a.root/'staging/transaction.json',json.dumps({'release':'new-main','phase':'DEPLOYED_VERIFIED'}))
        with self.assertRaisesRegex(RuntimeError,'SUPERSEDED'):a.stage('approved-old')
    def test_missing_configuration_is_blocking(self):
        with self.assertRaises(FileNotFoundError):h.Host(self.tmp.name,'staging')
    def test_success_persists_pair_and_clears_startup_drain(self):
        a=self.host;a.protected=0;a.cfg['drainTimeoutSeconds']=1
        for d in ['staging','pages-current','pages','production/client/assets','releases/old','releases/new']:(a.root/d).mkdir(parents=True,exist_ok=True)
        h.atomic(a.root/'staging/transaction.json',json.dumps({'release':'new','phase':'DEPLOYED_VERIFIED'}));h.atomic(a.root/'pages-current/index.html','old');h.atomic(a.root/'pages/index.html','new')
        a.stage('new');self.assertEqual(a.state['phase'],'SERVER_STAGED_DRAINED');self.assertNotIn('/admin/undrain',a.calls)
        a.publishing();a.finish();self.assertEqual(a.state['phase'],'ADMITTED_PENDING_SMOKE');a.verified();self.assertEqual(a.state['phase'],'DEPLOYED_VERIFIED');self.assertEqual((a.root/'pages-current/index.html').read_text(),'new');self.assertEqual(h.env_values(a.c['env'])['SERVER_IMAGE'],'new');self.assertEqual(h.env_values(a.c['env'])['DRAIN_ON_START'],'false');self.assertEqual(a.admission.read_text(),'open')
    def test_artifact_checksum_failure_prevents_any_replacement(self):
        a=self.host;release='a'*40;folder=a.root/'releases'/release;folder.mkdir(parents=True)
        h.atomic(folder/'payload','tampered');h.atomic(folder/'manifest.json',json.dumps({'releaseId':release,'sourceSha':release,'checksums':{'payload':'bad'}}))
        with self.assertRaisesRegex(RuntimeError,'ARTIFACT_CHECKSUM'):h.Host.bundle(a,release)
        self.assertEqual(a.calls,[])
    def isolated(self):
        a=self.host;a.cfg['validationMode']='github-actions';release='a'*40
        m={'releaseId':release,'images':{'production':'sha256:image'},'fingerprint':{'buildId':release,'contentHash':'content','engineRevision':'engine','protocolVersion':33}}
        h.atomic(a.root/'manifest.json',json.dumps(m))
        receipt={'schema':1,'kind':'github-actions-isolated-docker','status':'PASS','oomKilled':False,'verifiedWorkflow':'.github/workflows/promote.yml','releaseId':release,'manifestSha256':h.sha(a.root/'manifest.json'),'imageId':m['images']['production'],'fingerprint':m['fingerprint'],'runId':'10','candidateRunId':'5','runAttempt':1,'toolsSha':'b'*40,'checks':[{'name':n,'status':'PASS'} for n in ('bundle','image','http-version','origins','lifecycle-controls')],'controls':{n:True for n in ('lobby','quiz','draft','move','attack','skill','resume','resumeMove','resumeAttack','resumeSkill','results','rematch','closed')}}
        return a,release,m,receipt
    def test_github_validation_does_not_require_a_second_server(self):
        a,release,m,r=self.isolated();h.atomic(a.root/'validations'/(release+'.json'),json.dumps(r));a.require_validation(release,a.root,m)
        self.assertFalse((a.root/'staging/transaction.json').exists());self.assertEqual(a.calls,[])
    def test_production_only_host_refuses_colocated_staging(self):
        a=self.host;a.target='staging';a.cfg['validationMode']='github-actions'
        with self.assertRaisesRegex(RuntimeError,'COLOCATED_STAGING_DISABLED'):h.Host.check_config(a)
        self.assertEqual(a.calls,[])
    def test_wrong_or_incomplete_receipt_blocks_before_mutation(self):
        a,release,m,r=self.isolated()
        for change in ({'releaseId':'c'*40},{'manifestSha256':'tampered'},{'status':'FAIL'},{'kind':'local-isolated-fixture'},{'imageId':'wrong'},{'oomKilled':True},{'checks':[]},{'controls':{**r['controls'],'resumeSkill':False}},{'verifiedWorkflow':'.github/workflows/ci.yml'}):
            v={**copy.deepcopy(r),**change};h.atomic(a.root/'validations'/(release+'.json'),json.dumps(v))
            with self.assertRaises(RuntimeError):a.require_validation(release,a.root,m)
        self.assertEqual(a.calls,[])
    def test_production_memory_threshold_and_psi_components_are_preserved(self):
        a=self.host;a.cfg['minMemoryBytes']=536870912
        metrics={'availableBytes':536870911,'oomKills':0,'psi':{'some':{'avg10':1.2},'full':{'avg10':0.0}}}
        with patch.object(h,'memory_status',return_value=metrics):
            with self.assertRaisesRegex(RuntimeError,'INSUFFICIENT_MEMORY'):a.check_memory()
        stored=h.read(a.dir/'memory-preflight.json');self.assertEqual(stored['minimumBytes'],536870912);self.assertNotEqual(stored['psi']['some'],stored['psi']['full']);self.assertEqual(a.calls,[])
    def test_settings_backup_preserves_existing_secret_values(self):
        a=self.host;before=pathlib.Path(a.c['env']).read_bytes();saved=pathlib.Path(a.backup_settings('a'*40));self.assertEqual((saved/'environment').read_bytes(),before);self.assertEqual(pathlib.Path(a.c['env']).read_bytes(),before)
if __name__=='__main__':unittest.main()
