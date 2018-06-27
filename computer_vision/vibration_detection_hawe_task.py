#!/usr/bin/env python

'''

Usage
-----
vibration_detection_hawe_task.py [<video_source>]


Keys
----
ESC - exit
'''

# Python 2/3 compatibility
from __future__ import print_function

import numpy as np
import cv2 as cv
import video
import math
from common import anorm2, draw_str
from time import clock

lk_params = dict( winSize  = (15, 15),
                  maxLevel = 2,
                  criteria = (cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 0.03))

feature_params = dict( maxCorners = 500,
                       qualityLevel = 0.3,
                       minDistance = 20,
                       blockSize = 7 )

class App:
    def __init__(self, video_src):
        self.track_len = 10
        self.detect_interval = 5
        self.tracks = []
        self.cam = video.create_capture(video_src)
        self.frame_idx = 0

    def run(self):
        fourcc = cv.VideoWriter_fourcc(*'XVID')
        out = cv.VideoWriter('output.mp4', fourcc, 30.0, (1280,720))
        while True:
            _ret, frame = self.cam.read()
            frame = cv.flip(frame, 0 )

            frame_gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)
            
            vis = frame.copy()

            if len(self.tracks) > 0:
                img0, img1 = self.prev_gray, frame_gray
                p0 = np.float32([tr[-1] for tr in self.tracks]).reshape(-1, 1, 2)
                p1, _st, _err = cv.calcOpticalFlowPyrLK(img0, img1, p0, None, **lk_params)
                p0r, _st, _err = cv.calcOpticalFlowPyrLK(img1, img0, p1, None, **lk_params)
                d = abs(p0-p0r).reshape(-1, 2).max(-1)
                good = d < 1
                new_tracks = []
                for tr, (x, y), good_flag in zip(self.tracks, p1.reshape(-1, 2), good):
                    if not good_flag:
                        continue
                    tr.append((x, y))
                    if len(tr) > self.track_len:
                        del tr[0]
                    new_tracks.append(tr)
                    cv.circle(vis, (x, y), 2, (0, 255, 0), -1)
                self.tracks = new_tracks
                cv.polylines(vis, [np.int32(tr) for tr in self.tracks], False, (0, 0, 255))
                draw_str(vis, (20, 20), 'track count: %d' % len(self.tracks))
                
                #detection
                count = 0
                all_average = 0
                all_absolute = 0
                all_length = 0
                for tr_point in self.tracks:
                        tracks_length = len(tr_point)
                        line_slope = []
                        sum_slope = 0
                        average = 0
                        length_long = 0
                        for i in range(0,tracks_length-1):
                            slope = (tr_point[i+1][1]-tr_point[i][1])/(tr_point[i+1][0]-tr_point[i][0])
                            length_long = length_long + np.sqrt((tr_point[i+1][1]-tr_point[i][1])**2+(tr_point[i+1][0]-tr_point[i][0])**2)
                            sum_slope = sum_slope + slope
                            line_slope.append(slope)
                        average = sum_slope/(tracks_length-1)
                        if not np.isnan(average) and not np.isinf(average):
                            all_average = average + all_average
                        if not np.isnan(length_long) and not np.isinf(length_long):
                            all_length = all_length + length_long
                        abso = 0
                        for j in line_slope:
                            abso = abs(j-average) + abso
                        if not np.isnan(abso):
                            all_absolute = all_absolute + abso
                        count = count + 1
                length_average = all_length / len(self.tracks)
                draw_str(vis, (20, 50), 'Variance: %f' % all_absolute)
                draw_str(vis, (20, 80), 'Mean: %f' % all_average)
                draw_str(vis, (20, 110), 'Length: %f' %length_average)
                if length_average >= 15:
                    cv.putText(vis,'Vibration', (600,500), cv.FONT_HERSHEY_SIMPLEX, 2,(255,0,0),4)


            if self.frame_idx % self.detect_interval == 0:
                mask = np.zeros_like(frame_gray)
                mask[:] = 255
                for x, y in [np.int32(tr[-1]) for tr in self.tracks]:
                    cv.circle(mask, (x, y), 5, 0, -1)
                p = cv.goodFeaturesToTrack(frame_gray, mask = mask, **feature_params)
                if p is not None:
                    for x, y in np.float32(p).reshape(-1, 2):
                        self.tracks.append([(x, y)])


            self.frame_idx += 1
            self.prev_gray = frame_gray
            #cv.imshow('lk_track', vis)
            out.write(vis)

            ch = cv.waitKey(1)
            if ch == 27:
                break

def main():
    import sys
    try:
        video_src = sys.argv[1]
    except:
        video_src = 0

    print(__doc__)
    App(video_src).run()
    out.release()
    cv.destroyAllWindows()

if __name__ == '__main__':
    main()
