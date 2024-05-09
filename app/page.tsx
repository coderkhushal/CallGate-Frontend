"use client"
import { gsap } from "gsap";
import {useGSAP} from "@gsap/react"
import Link from 'next/link'
import React from 'react'

const HomePage = () => {
  useGSAP(()=>{
    gsap.to("#main", {
      // write a animation that appears the main div with rotation
      rotation: 1060,
      duration: 1.5,
      ease: "elastic",
     });
  })
  return (
    <>
    <div id='main' className="m-auto justify-center items-center flex w-1/2 h-1/2 bg-blue-400">
      
      <Link href="/main">
      <button className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Go to Main page</button>

      </Link>
    </div>
    </>
  )
}

export default HomePage

/*
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Video Streaming</title>
</head>
<body>
    <video id="videoPlayer" controls autoplay></video>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.1.3/socket.io.js"></script>
    <script>
        const socket = io();
        const videoElement = document.getElementById('videoPlayer');
        videoElement.controls = true;

        // Event listener for receiving video data from the server
        socket.on('videoData', (data) => {
            appendVideoData(data);
        });

        // Function to append video data to the video element
        function appendVideoData(data) {
            // Convert received array buffer to Blob
            const videoBlob = new Blob([data], { type: 'video/mp4' });

            // Create a Blob URL for the video Blob
            const videoBlobUrl = URL.createObjectURL(videoBlob);

            // Check if video source exists, if not set it
            if (!videoElement.src) {
                videoElement.src = videoBlobUrl;
            } else {
                // Otherwise, append the new video data to the current source
                const mediaSource = new MediaSource();
                const sourceBuffer = mediaSource.addSourceBuffer('video/mp4');
                
                // Event listener for updating source buffer
                sourceBuffer.addEventListener('updateend', () => {
                    mediaSource.endOfStream();
                    videoElement.src = URL.createObjectURL(mediaSource);
                });

                // Append new video data to source buffer
                sourceBuffer.appendBuffer(data);
            }
        }
    </script>
</body>
</html>

*/