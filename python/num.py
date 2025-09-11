import time


def countdown_timer(seconds: int) -> None:
    for remaining in range(seconds, 0, -1):
        print(f"\rTime left: {remaining} seconds", end="", flush=True)
        time.sleep(1)
    print("\rTime's up!                ")


if __name__ == "__main__":
    countdown_timer(10)
