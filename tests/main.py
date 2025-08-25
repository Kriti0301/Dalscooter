#!/usr/bin/env python3

import unittest
import sys
import os
import time
from io import StringIO
import json
import traceback

# Add paths
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
aws_lambda_dir = os.path.join(project_root, 'AWSLambda')

for path in [current_dir, project_root, aws_lambda_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

class ImprovedTestRunner:
    """Test runner with better error handling and reporting"""
    
    def __init__(self):
        self.results = {}
        self.start_time = None
        self.end_time = None
        
    def run_module_tests(self, module_name):
        """Run tests for a specific module with error handling"""
        print(f"\n{'='*60}")
        print(f"Testing {module_name}")
        print(f"{'='*60}")
        
        try:
            print(f"Importing {module_name}...")
            module = __import__(module_name)
            print(f"Successfully imported {module_name}")
            
            loader = unittest.TestLoader()
            suite = loader.loadTestsFromModule(module)
            
            test_count = suite.countTestCases()
            print(f"Found {test_count} test cases")
            
            if test_count == 0:
                print("Warning: No tests found in module")
                self.results[module_name] = {
                    'tests_run': 0, 'failures': 0, 'errors': 0, 'skipped': 0,
                    'success_rate': 0.0, 'output': 'No tests found', 'success': True
                }
                return
            
            stream = StringIO()
            runner = unittest.TextTestRunner(
                stream=stream,
                verbosity=2,
                buffer=True
            )
            
            print(f"Running {test_count} tests...")
            result = runner.run(suite)
            
            self.results[module_name] = {
                'tests_run': result.testsRun,
                'failures': len(result.failures),
                'errors': len(result.errors),
                'skipped': len(result.skipped) if hasattr(result, 'skipped') else 0,
                'success_rate': ((result.testsRun - len(result.failures) - len(result.errors)) / max(result.testsRun, 1)) * 100,
                'output': stream.getvalue(),
                'success': len(result.failures) == 0 and len(result.errors) == 0
            }
            
            print(f"\nResults for {module_name}:")
            print(f"   Tests Run: {result.testsRun}")
            print(f"   Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
            print(f"   Failures: {len(result.failures)}")
            print(f"   Errors: {len(result.errors)}")
            print(f"   Success Rate: {self.results[module_name]['success_rate']:.1f}%")
            
            if result.failures:
                print(f"\nFirst few failures:")
                for i, (test, traceback_text) in enumerate(result.failures[:3]):
                    error_line = self._extract_error_line(traceback_text)
                    print(f"   {i+1}. {test.id()}")
                    print(f"      Error: {error_line}")
                    
                if len(result.failures) > 3:
                    print(f"   ... and {len(result.failures) - 3} more failures")
            
            if result.errors:
                print(f"\nFirst few errors:")
                for i, (test, traceback_text) in enumerate(result.errors[:3]):
                    error_line = self._extract_error_line(traceback_text)
                    print(f"   {i+1}. {test.id()}")
                    print(f"      Error: {error_line}")
                    
                if len(result.errors) > 3:
                    print(f"   ... and {len(result.errors) - 3} more errors")
                    
        except ImportError as e:
            print(f"ERROR: Could not import {module_name}: {e}")
            print(f"   This usually means missing dependencies or import path issues")
            self.results[module_name] = {
                'tests_run': 0, 'failures': 0, 'errors': 1, 'skipped': 0,
                'success_rate': 0.0, 'output': f'Import error: {str(e)}', 'success': False
            }
        except Exception as e:
            print(f"ERROR: Unexpected error in {module_name}: {e}")
            print(f"   Traceback:")
            traceback.print_exc()
            self.results[module_name] = {
                'tests_run': 0, 'failures': 0, 'errors': 1, 'skipped': 0,
                'success_rate': 0.0, 'output': f'Unexpected error: {str(e)}', 'success': False
            }
    
    def _extract_error_line(self, traceback_text):
        """Extract the most relevant error line from traceback"""
        if not traceback_text:
            return "Unknown error"
        
        lines = traceback_text.strip().split('\n')
        
        # Look for the actual error message (usually the last line)
        for line in reversed(lines):
            line = line.strip()
            if line and not line.startswith('File ') and not line.startswith('    '):
                return line
        
        # Fallback to last line
        return lines[-1] if lines else "Unknown error"
    
    def run_all_tests(self):
        """Run all test modules"""
        print("Starting DALScooter Test Suite")
        print("=" * 80)
        print(f"Working Directory: {current_dir}")
        print(f"Project Root: {project_root}")
        print(f"AWS Lambda Dir: {aws_lambda_dir}")
        print("=" * 80)
        
        # Test modules to run (in order of complexity)
        modules = [
            ('testauthentication', 'Authentication Module'),
            ('testdataanalysis', 'Data Analysis Module'), 
            ('testmessaging', 'Messaging Module'),
            ('testsecurityperformance', 'Security & Performance Module')
        ]
        
        self.start_time = time.time()
        
        for module_name, description in modules:
            print(f"\nStarting {description}")
            self.run_module_tests(module_name)
        
        self.end_time = time.time()
        self.print_final_report(self.end_time - self.start_time)
    
    def print_final_report(self, total_duration):
        """Print comprehensive final test report"""
        print(f"\n{'='*80}")
        print("FINAL TEST REPORT")
        print(f"{'='*80}")
        
        # Calculate overall statistics
        total_tests = sum(r['tests_run'] for r in self.results.values())
        total_failures = sum(r['failures'] for r in self.results.values())
        total_errors = sum(r['errors'] for r in self.results.values())
        total_passed = total_tests - total_failures - total_errors
        
        print(f"Overall Statistics:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {total_passed}")
        print(f"   Failed: {total_failures}")
        print(f"   Errors: {total_errors}")
        print(f"   Duration: {total_duration:.2f}s")
        
        if total_tests > 0:
            success_rate = (total_passed / total_tests) * 100
            print(f"   Overall Success Rate: {success_rate:.1f}%")
        else:
            success_rate = 0
            print(f"   Overall Success Rate: 0.0% (No tests ran)")
        
        print(f"\nPer-Module Results:")
        for module, results in self.results.items():
            status_text = "PASS" if results['success'] else "FAIL"
            
            print(f"   {module:<25} {status_text:>6} "
                  f"({results['tests_run']:3} tests, {results['success_rate']:5.1f}%)")
            
            # Show key issues for failed modules
            if not results['success'] and results['tests_run'] > 0:
                if results['errors'] > 0:
                    print(f"      {results['errors']} errors")
                if results['failures'] > 0:
                    print(f"      {results['failures']} failures")
        
        # Provide recommendations
        print(f"\nRecommendations:")
        
        if success_rate >= 80:
            print("   Great job! Most tests are passing.")
            print("   Focus on fixing the remaining few issues.")
        elif success_rate >= 50:
            print("   Good progress! More than half the tests are working.")
            print("   Continue fixing the main error patterns.")
        elif total_tests > 0:
            print("   Tests are running but many issues remain.")
            print("   Focus on the most common error patterns first.")
        else:
            print("   No tests are running successfully.")
            print("   Check import paths and dependencies.")
        
        # Common issues guidance
        error_count = sum(r['errors'] for r in self.results.values())
        failure_count = sum(r['failures'] for r in self.results.values())
        
        print(f"\nIssue Breakdown:")
        if error_count > failure_count:
            print("   More errors than failures - likely setup/import issues")
            print("   Focus on fixing MockDataGenerator and import paths")
        elif failure_count > error_count:
            print("   More failures than errors - logic issues in tests")
            print("   Focus on test assertions and expected behavior")
        
        if any('AttributeError' in r['output'] for r in self.results.values()):
            print("   AttributeError detected - missing methods or incorrect imports")
        
        if any('TypeError' in r['output'] for r in self.results.values()):
            print("   TypeError detected - check function parameters and data types")
        
        # Save detailed results
        self._save_detailed_results(total_duration, success_rate)
        
        print(f"\n{'='*80}")
        
        return success_rate >= 50  # Return True if reasonably successful
    
    def _save_detailed_results(self, total_duration, success_rate):
        """Save detailed results to JSON file"""
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        results_file = f"detailed_test_results_{timestamp}.json"
        
        detailed_results = {
            'timestamp': timestamp,
            'total_duration': total_duration,
            'summary': {
                'total_tests': sum(r['tests_run'] for r in self.results.values()),
                'passed': sum(r['tests_run'] - r['failures'] - r['errors'] for r in self.results.values()),
                'failed': sum(r['failures'] for r in self.results.values()),
                'errors': sum(r['errors'] for r in self.results.values()),
                'success_rate': success_rate
            },
            'modules': self.results,
            'environment': {
                'python_version': sys.version,
                'working_directory': current_dir,
                'project_root': project_root,
                'aws_lambda_dir': aws_lambda_dir
            }
        }
        
        try:
            with open(results_file, 'w') as f:
                json.dump(detailed_results, f, indent=2, default=str)
            print(f"Detailed results saved to: {results_file}")
        except Exception as e:
            print(f"Failed to save detailed results: {e}")

def main():
    """Main function to run the improved test suite"""
    print("DALScooter Test Runner")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.basename(current_dir) == 'tests':
        print(f"Warning: Expected to be in 'tests' directory")
        print(f"   Current: {current_dir}")
        print(f"   Continuing anyway...")
    
    # Check if key files exist
    required_files = ['testbaseconfig.py']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"Missing required files: {missing_files}")
        print("Make sure you've run the fix script first:")
        print("   python final_fix.py")
        return False
    
    print("Environment looks good, starting tests...")
    
    # Run the test suite
    runner = ImprovedTestRunner()
    success = runner.run_all_tests()
    
    return success

if __name__ == '__main__':
    try:
        success = main()
        exit_code = 0 if success else 1
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTest run interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        traceback.print_exc()
        sys.exit(1)