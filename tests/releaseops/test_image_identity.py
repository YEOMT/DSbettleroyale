import unittest,tempfile,pathlib,json,tarfile,io,hashlib,subprocess,importlib.util
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('host_identity',pathlib.Path(__file__).resolve().parents[2]/'tools/deploy/host.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
class ImageIdentity(unittest.TestCase):
    def setUp(self):
        pathlib.Path('artifacts').mkdir(exist_ok=True);self.tmp=tempfile.TemporaryDirectory(dir='artifacts');self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name)
        self.config={'os':'linux','architecture':'amd64','rootfs':{'type':'layers','diff_ids':['sha256:'+'c'*64]}}
        self.raw=json.dumps(self.config).encode();self.expected='sha256:'+hashlib.sha256(self.raw).hexdigest()
        self.manifest=json.dumps({'schemaVersion':2,'config':{'digest':self.expected},'layers':[]}).encode();self.reference='sha256:'+hashlib.sha256(self.manifest).hexdigest()
        self.descriptor={'mediaType':'application/vnd.oci.image.manifest.v1+json','digest':self.reference,'size':len(self.manifest)}
        self.loaded={'Id':self.reference,'Os':'linux','Architecture':'amd64','RootFS':{'Layers':self.config['rootfs']['diff_ids']}}
        self.host=object.__new__(h.Host);self.host.target='production'
        self.write()
    def write(self,raw=None,manifest=None,descriptors=None):
        with tarfile.open(self.root/'production-image.tar','w') as saved:
            for name,data in [('blobs/sha256/'+self.expected[7:],self.raw if raw is None else raw),('blobs/sha256/'+self.reference[7:],self.manifest if manifest is None else manifest),('index.json',json.dumps({'schemaVersion':2,'manifests':[self.descriptor] if descriptors is None else descriptors}).encode())]:
                info=tarfile.TarInfo(name);info.size=len(data);saved.addfile(info,io.BytesIO(data))
    def docker_run(self,args,loaded=None):
        if args[-1]==self.expected:raise subprocess.CalledProcessError(1,args)
        self.assertEqual(args[-1],self.reference);return json.dumps([self.loaded if loaded is None else loaded])
    def resolve(self):return self.host.resolve_image(self.root,{'images':{'production':self.expected}})
    def test_classic_store_keeps_exact_config_reference(self):
        with patch.object(self.host,'run',return_value='[]') as run:self.assertEqual(self.resolve(),self.expected)
        self.assertEqual(run.call_count,1)
    def test_containerd_resolves_same_hashed_config_and_layers(self):
        with patch.object(self.host,'run',side_effect=self.docker_run):self.assertEqual(self.resolve(),self.reference)
        self.assertEqual(h.saved_oci_identity(self.root/'production-image.tar',self.expected)['configDigest'],self.expected)
    def test_modified_config_is_rejected(self):
        self.write(raw=self.raw+b' ')
        with patch.object(self.host,'run',side_effect=self.docker_run),self.assertRaisesRegex(RuntimeError,'CHECKSUM'):self.resolve()
    def test_modified_manifest_is_rejected(self):
        self.write(manifest=self.manifest+b' ')
        with patch.object(self.host,'run',side_effect=self.docker_run),self.assertRaisesRegex(RuntimeError,'CHECKSUM'):self.resolve()
    def test_missing_or_ambiguous_manifest_is_rejected(self):
        for descriptors in ([],[self.descriptor,self.descriptor]):
            self.write(descriptors=descriptors)
            with patch.object(self.host,'run',side_effect=self.docker_run),self.assertRaisesRegex(RuntimeError,'AMBIGUOUS'):self.resolve()
    def test_loaded_id_architecture_os_or_layers_mismatch_is_rejected(self):
        for change in ({'Id':self.expected},{'Architecture':'arm64'},{'Os':'windows'},{'RootFS':{'Layers':[]}}):
            with patch.object(self.host,'run',side_effect=lambda args:self.docker_run(args,{**self.loaded,**change})),self.assertRaisesRegex(RuntimeError,'IDENTITY_MISMATCH'):self.resolve()
    def test_wrong_declared_metadata_size_is_rejected(self):
        self.write(descriptors=[{**self.descriptor,'size':1}])
        with patch.object(self.host,'run',side_effect=self.docker_run),self.assertRaisesRegex(RuntimeError,'METADATA_SIZE'):self.resolve()
if __name__=='__main__':unittest.main()
