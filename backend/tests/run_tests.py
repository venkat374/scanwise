import test_routine_engine
import sys

def run():
    print("Running tests...")
    try:
        test_routine_engine.test_no_conflicts()
        print("test_no_conflicts: PASS")
    except Exception as e:
        print(f"test_no_conflicts: FAIL - {e}")

    try:
        test_routine_engine.test_retinol_vs_aha()
        print("test_retinol_vs_aha: PASS")
    except Exception as e:
        print(f"test_retinol_vs_aha: FAIL - {e}")

    try:
        test_routine_engine.test_multiple_conflicts()
        print("test_multiple_conflicts: PASS")
    except Exception as e:
        print(f"test_multiple_conflicts: FAIL - {e}")

if __name__ == "__main__":
    run()
