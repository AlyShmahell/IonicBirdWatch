import os
from PIL import Image
import io
import cv2
import base64
import numpy as np


def img2base64(path):
    """
    - a function that encodes an image file into base64
    - parameters:
        - path: path to image file
    - returns:
        - base64 encoded image
    """
    img = cv2.imread(path).astype(np.uint8)
    _, imbuff = cv2.imencode(".png", img)
    iobuf  = io.BytesIO(imbuff)
    imbyte = iobuf.getvalue()
    return  base64.b64encode(imbyte).decode("ascii")