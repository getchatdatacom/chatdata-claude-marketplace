import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("publish_bundle.py")
SPEC = importlib.util.spec_from_file_location("publish_bundle", MODULE_PATH)
PUBLISH_BUNDLE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(PUBLISH_BUNDLE)


class EvalOracleFixtureTest(unittest.TestCase):
    def test_all_thirty_eval_cases_publish_with_context_oracles(self):
        fixture = MODULE_PATH.parent.parent / "assets" / "template-repo" / "evals" / "recurring_questions.yaml"
        cases = PUBLISH_BUNDLE.build_eval_questions(fixture)
        required_fields = {
            "requiredContextIds",
            "eligibleContextIds",
            "retrievedContextIds",
            "appliedContextIds",
            "failureLayer",
        }

        self.assertEqual(len(cases), 30)
        self.assertTrue(all(required_fields.issubset(case) for case in cases))
        self.assertTrue(all(case["requiredContextIds"] and case["eligibleContextIds"] for case in cases))


if __name__ == "__main__":
    unittest.main()
