"""Independent-review regressions; filesystem and event routing, no models."""
from pathlib import Path
import json
import os
import subprocess
import tempfile
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[1]
HOST = (ROOT / 'tests/spotify_design_native_host.mjs').as_uri()


class ReviewRegressions(unittest.TestCase):
    def js(self, body, *args):
        result = subprocess.run(['node', '--input-type=module', '-e', body, *map(str, args)],
                                cwd=ROOT, capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_every_reader_and_searcher_is_audited_with_canonical_scope(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory).resolve()
            project = base / 'fixture'
            scope = project / 'input'
            scope.mkdir(parents=True)
            (scope / 'valid.md').write_text('source')
            (base / 'foreign.md').write_text('not authorized')
            (scope / 'escape.md').symlink_to(base / 'foreign.md')
            script = f'''import {{auditToolTrace,claudeReadTrace,piReadTrace}} from {json.dumps(HOST)};
const root=process.argv[1];
const names=['Read','Grep','Glob','read','anchor_grep'];
const verdicts=[];
for(const tool of names){{
 for(const path of ['input/valid.md','../foreign.md','input/escape.md']){{
  try{{auditToolTrace([{{tool,path,ok:true}}],root,[root+'/input']);verdicts.push(true);}}catch{{verdicts.push(false);}}
 }}
}}
const claude=claudeReadTrace({{messages:[{{message:{{content:[{{type:'tool_use',id:'c',name:'Grep',input:{{path:root+'/input',pattern:'x'}}}}]}}}},{{message:{{content:[{{type:'tool_result',tool_use_id:'c',is_error:false}}]}}}}]}});
const pi=piReadTrace([{{message:{{content:[{{type:'toolCall',id:'p',name:'anchor_grep',arguments:{{path:root+'/input',pattern:'x'}}}}]}}}},{{message:{{role:'toolResult',toolCallId:'p',isError:false}}}}]);
let traversal=false;try{{auditToolTrace([{{tool:'Glob',path:'input',pattern:'../../**',ok:true}}],root,[root+'/input']);}}catch{{traversal=true;}}
console.log(JSON.stringify({{verdicts,claudeTools:claude.map(x=>x.tool),piTools:pi.map(x=>x.tool),traversal}}));'''
            out = self.js(script, project)
            self.assertEqual(out['verdicts'], [True, False, False] * 5)
            self.assertEqual(out['claudeTools'], ['Grep'])
            self.assertEqual(out['piTools'], ['anchor_grep'])
            self.assertTrue(out['traversal'])

    def test_claude_catalog_leak_is_rejected_independent_of_successful_reads(self):
        script = f'''import {{validateClaudeCatalog}} from {json.dumps(HOST)};
const known=['readme-builtin'];
const good={{skills:['readme-builtin','spotify-design'],plugins:[]}};
const verdicts=[good,{{...good,skills:[...good.skills,'spotify-ancestor-sentinel']}},{{...good,skills:[...good.skills,'foreign-user-skill']}},{{...good,plugins:[{{name:'foreign'}}]}}].map(x=>{{try{{validateClaudeCatalog(x,known,['spotify-design']);return true;}}catch{{return false;}}}});
console.log(JSON.stringify(verdicts));'''
        self.assertEqual(self.js(script), [True, False, False, False])

    def test_supervisor_router_waits_for_owned_real_parent_reply_receipt(self):
        script = f'''import {{supervisorRouter}} from {json.dumps(HOST)};
const handlers=new Map(),calls=[];
const bus={{on:(channel,fn)=>{{handlers.set(channel,fn);return ()=>handlers.delete(channel);}}}};
const receipts=new Set();
// Only the external parent-model boundary is doubled. Router state/correlation is real.
const router=supervisorRouter(bus,async request=>{{calls.push(request);receipts.add(request.requestId);}},id=>receipts.has(id));
router.bind('owned');
handlers.get('pi-intercom:detach-request')({{requestId:'foreign-q',runId:'foreign'}});
handlers.get('pi-intercom:detach-request')({{requestId:'owned-q',runId:'owned'}});
handlers.get('pi-intercom:detach-request')({{requestId:'owned-q',runId:'owned'}});
await router.drain();router.dispose();
console.log(JSON.stringify({{replyCount:calls.length,runId:calls[0].runId,requestId:calls[0].requestId,handlers:handlers.size}}));'''
        self.assertEqual(self.js(script), {'replyCount': 1, 'runId': 'owned', 'requestId': 'owned-q', 'handlers': 0})

    def test_failure_cleanup_requires_observed_terminal_not_stop_ack(self):
        script = f'''import {{stopOwnedRun}} from {json.dumps(HOST)};
let handler,observed=false,settled=false,stops=0;
const bus={{on:(_name,fn)=>{{handler=fn;return ()=>{{}};}}}};
const status=()=>({{details:{{runId:'owned',lifecycleStatus:{{processTerminal:{{runId:'owned',state:observed?'observed':'pending'}}}}}}}});
const rpc=async(method)=>{{if(method==='stop'){{stops++;return {{state:'stopping'}};}}return status();}};
const pending=stopOwnedRun(rpc,bus,{{processTerminal:'closed'}},'owned',2000).then(x=>{{settled=true;return x;}});
await new Promise(resolve=>setImmediate(resolve));
if(settled)throw Error('stop acknowledgement was treated as terminal');
handler({{runId:'foreign',state:'observed'}});
await Promise.resolve();if(settled)throw Error('foreign proof accepted');
observed=true;handler({{runId:'owned',state:'observed'}});
const result=await pending;
console.log(JSON.stringify({{terminal:result.details.lifecycleStatus.processTerminal.state,stops}}));'''
        self.assertEqual(self.js(script), {'terminal': 'observed', 'stops': 1})

    def test_c3_has_matching_learning_image_and_normal_spec(self):
        out = ROOT / 'work/spotify-design-validation' / ('unit-c3-' + uuid.uuid4().hex)
        result = subprocess.run(['node', str(ROOT / 'tests/probe_spotify_design_managers.mjs'),
                                 '--runtime', 'pi', '--role', 'ui', '--case', 'C3',
                                 '--variant', 'baseline', '--out', str(out), '--prepare-only'],
                                cwd=ROOT, capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stderr)
        manifest = json.loads((out / 'manifest.json').read_text())
        self.assertIn('ui-learning.png', manifest['sourceHashes'])
        self.assertIn('normal-spec.md', manifest['sourceHashes'])
        self.assertTrue((out / 'fixture/input/normal-spec.md').is_file())
        self.assertIn('normal-spec.md', manifest['jobs'][0]['task'])

    def test_control_definition_and_effective_intent_are_connected_without_provider(self):
        out = ROOT / 'work/spotify-design-validation' / ('unit-control-' + uuid.uuid4().hex)
        result = subprocess.run(['node', str(ROOT / 'tests/probe_spotify_design_managers.mjs'),
                                 '--runtime', 'pi', '--role', 'ux', '--case', 'micro',
                                 '--variant', 'baseline', '--out', str(out), '--prepare-only'],
                                cwd=ROOT, capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stderr)
        manifest = json.loads((out / 'manifest.json').read_text())
        definition = (out / 'fixture/.pi/agents/spotify-control-ux.md').read_text()
        tools = next(line for line in definition.splitlines() if line.startswith('tools:'))
        self.assertEqual([s.strip() for s in tools.removeprefix('tools:').split(',')],
                         manifest['effectiveToolIntent']['pi'])


if __name__ == '__main__':
    unittest.main()
