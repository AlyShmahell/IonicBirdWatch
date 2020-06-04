import os
import cv2
import base64

def img2base64(path):
    img = cv2.imread(path)
    return base64.b64encode(img).decode("utf8")

if __name__ == '__main__':
    print(img2base64(os.path.join('.', 'docs', 'image.png')))