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


def rand2img2base64(x,y,z):
    """
    - a function that generates a random base64 image
    - parameters:
        - x: length of the image over the x-axis
        - y: length of the image over the y-axis
        - z: length of the image over the z-axis
    - returns:
        - base64 encoded image
    """
    arr = np.random.randint(low = 0, high = 255, size = (x, y, z)).astype(np.uint8)
    _, imbuff = cv2.imencode(".png", arr)
    iobuf  = io.BytesIO(imbuff)
    imbyte = iobuf.getvalue()
    return  base64.b64encode(imbyte).decode("ascii")


if __name__ == '__main__':
    b64 = rand2img2base64(x=3,y=3,z=3)
    print(b64)