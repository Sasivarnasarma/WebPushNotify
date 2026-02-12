import logging
import sys


def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    for handler in logger.handlers:
        logger.removeHandler(handler)

    stream_handler = logging.StreamHandler(sys.stdout)
    file_handler = logging.FileHandler("app.log")
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    stream_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)
    logger.addHandler(file_handler)
