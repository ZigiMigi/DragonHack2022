import cv2

img = cv2.imread("./forest_road.jpg")

while True:
    cv2.imshow("Img", img)
    if cv2.waitKey() == ord("q"):
        break
