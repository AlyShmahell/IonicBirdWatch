import os
from PIL import Image
import io
import cv2
import base64
import numpy as np


def img2base64(path):
    img = cv2.imread(path).astype(np.uint8)
    _, imbuff = cv2.imencode(".png", img)
    iobuf  = io.BytesIO(imbuff)
    imbyte = iobuf.getvalue()
    return  base64.b64encode(imbyte).decode("ascii")

if __name__ == '__main__':
    with open('icon.txt', 'w') as f:
        f.write(img2base64('icon.png'))