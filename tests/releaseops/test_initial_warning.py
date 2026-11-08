import unittest,tempfile,pathlib,json,copy
from unittest.mock import patch
from test_host import Fake,h

def report(degraded=True):
    controls={k:True for k in h.PUBLIC_CONTROLS};warnings=[]
    if degraded:
        controls.update(resumeMove='WARNING',resumeAttack='NOT_RUN',resumeSkill='NOT_RUN')
        warnings=[{'code':'POST_RESUME_CONTROL_TIMEOUT','failedCheck':'resumeMove','stage':'ready'}]
    return {'status':'DEGRADED_RELEASE' if degraded else 'PASS','buildId':h.INITIAL_RELEASE,'controls':controls,'warnings':warnings,'diagnostics':[]}

class InitialWarning(unittest.TestCase):
    def setUp(self):
        pathlib.Path('artifacts').mkdir(exist_ok=True);self.tmp=tempfile.TemporaryDirectory(dir='artifacts');self.addCleanup(self.tmp.cleanup);self.a=Fake(self.tmp.name)
        a=self.a;a.cfg.update(validationMode='github-actions',pagesOrigin='https://yeomt.github.io');a.c['public']='https://15-165-114-145.sslip.io'
        h.atomic(a.root/'pages-current/index.html','old Firebase page')
        h.atomic(a.root/'validations'/(h.INITIAL_RELEASE+'.json'),json.dumps({'candidateRunId':h.INITIAL_CANDIDATE_RUN,'runId':'123'}))
        (a.root/'releases'/h.INITIAL_RELEASE).mkdir(parents=True)
    def authorize(self):
        with patch.object(h,'INITIAL_PAGES_HASH',h.sha(self.a.root/'pages-current/index.html')):
            return self.a.initial_warning(h.INITIAL_RELEASE,{'releaseId':h.INITIAL_PREVIOUS})
    def test_scope_and_consumption_are_checked_before_admission_or_replacement(self):
        a=self.a;self.assertEqual(self.authorize()['candidateRunId'],h.INITIAL_CANDIDATE_RUN)
        with self.assertRaises(RuntimeError):a.initial_warning('b'*40,{'releaseId':h.INITIAL_PREVIOUS})
        with self.assertRaises(RuntimeError):a.initial_warning(h.INITIAL_RELEASE,{'releaseId':'other'})
        with self.assertRaisesRegex(RuntimeError,'FIREBASE'):a.initial_warning(h.INITIAL_RELEASE,{'releaseId':h.INITIAL_PREVIOUS})
        a.target='staging'
        with self.assertRaisesRegex(RuntimeError,'SCOPE'):self.authorize()
        a.target='production';h.atomic(a.root/'initial-resume-warning-consumed.json','{}')
        with self.assertRaisesRegex(RuntimeError,'ALREADY_COMPLETED'):self.authorize()
        self.assertEqual(a.calls,[])
    def test_other_candidate_run_and_previously_published_pair_are_not_eligible(self):
        a=self.a;h.atomic(a.root/'validations'/(h.INITIAL_RELEASE+'.json'),json.dumps({'candidateRunId':'other'}))
        with self.assertRaisesRegex(RuntimeError,'CANDIDATE'):self.authorize()
        h.atomic(a.root/'releases'/h.INITIAL_RELEASE/'production-verified.json','{}')
        with self.assertRaisesRegex(RuntimeError,'ALREADY_COMPLETED'):self.authorize()
    def test_all_other_public_checks_and_warning_scope_are_mandatory(self):
        self.assertEqual(h.validate_public_smoke(report(),h.INITIAL_RELEASE,True),'DEGRADED_RELEASE')
        for name in h.PUBLIC_CONTROLS:
            if name in h.RESUME_CONTROLS:continue
            r=report();r['controls'][name]=False
            with self.assertRaises(RuntimeError):h.validate_public_smoke(r,h.INITIAL_RELEASE,True)
        for r,allowed in [(report(),False),({**report(),'buildId':'other'},True),({**report(),'status':'PASS'},True),({**report(),'warnings':[]},True)]:
            with self.assertRaises(RuntimeError):h.validate_public_smoke(r,h.INITIAL_RELEASE,allowed)
    def test_degraded_is_persisted_separately_never_marked_verified_and_can_restore(self):
        a=self.a;a.state={'release':h.INITIAL_RELEASE,'phase':'ADMITTED_PENDING_SMOKE','initialResumeWarning':self.authorize(),'previous':a.observed(),'replaced':True}
        path=a.root/'incoming/public-smoke.json';h.atomic(path,json.dumps(report()));a.verified(path)
        self.assertEqual(a.state['phase'],'DEGRADED_RELEASE');self.assertTrue((a.root/'releases'/h.INITIAL_RELEASE/'production-degraded.json').exists());self.assertFalse((a.root/'releases'/h.INITIAL_RELEASE/'production-verified.json').exists())
        self.assertTrue((a.root/'initial-resume-warning-consumed.json').exists())
        a.protected=0;a.cfg['drainTimeoutSeconds']=1;a.restore();self.assertEqual(a.state['phase'],'ROLLBACK_STAGED');self.assertEqual(a.admission.read_text(),'closed');self.assertIn('/admin/seal',a.calls)
    def test_warning_mode_cannot_finalize_without_report_or_with_failed_rematch(self):
        a=self.a;a.state={'release':h.INITIAL_RELEASE,'phase':'ADMITTED_PENDING_SMOKE','initialResumeWarning':self.authorize()}
        with self.assertRaisesRegex(RuntimeError,'REPORT_REQUIRED'):a.verified()
        r=report();r['controls']['rematch']=False;path=a.root/'incoming/public-smoke.json';h.atomic(path,json.dumps(r))
        with self.assertRaisesRegex(RuntimeError,'CONTROL_FAILED'):a.verified(path)
        self.assertFalse((a.root/'initial-resume-warning-consumed.json').exists());self.assertEqual(a.state['phase'],'ADMITTED_PENDING_SMOKE')
    def test_full_success_still_consumes_the_one_time_exception(self):
        a=self.a;a.state={'release':h.INITIAL_RELEASE,'phase':'ADMITTED_PENDING_SMOKE','initialResumeWarning':self.authorize()}
        path=a.root/'incoming/public-smoke.json';h.atomic(path,json.dumps(report(False)));a.verified(path)
        self.assertEqual(a.state['phase'],'DEPLOYED_VERIFIED');self.assertTrue((a.root/'initial-resume-warning-consumed.json').exists())
if __name__=='__main__':unittest.main()
