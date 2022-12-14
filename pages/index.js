import Head from 'next/head'
import Script from 'next/script'



// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = 'https://teachablemachine.withgoogle.com/models/iQ5T3L2V9/';
let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
  const modelURL = URL + 'model.json';
  const metadataURL = URL + 'metadata.json';

  // load the model and metadata
  // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
  model = await tmPose.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const flip = true; // whether to flip the webcam
  webcam = new tmPose.Webcam(1280, 720, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  webcam.play();

  window.requestAnimationFrame(loop);


  // append/get elements to the DOM
  const canvas = document.getElementById('canvas');
  canvas.width = 1280; canvas.height = 720;
  ctx = canvas.getContext('2d');
  labelContainer = document.getElementById('label-container');
  for (let i = 0; i < maxPredictions; i++) { // and class labels
    labelContainer.appendChild(document.createElement('div'));
  }
}

async function loop(timestamp) {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  // Prediction #1: run input through posenet
  // estimatePose can take in an image, video or canvas html element
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas, false);
  // Prediction 2: run input through teachable machine classification model
  const prediction = await model.predict(posenetOutput);

  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ': ' + prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  // finally draw the poses
  drawPose(pose);
}

function drawPose(pose) {
  ctx.drawImage(webcam.canvas, 0, 0);
  // draw the keypoints and skeleton
  if (pose) {
    const minPartConfidence = 0.5;
    tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
    tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
  }
}

export default function Home() {

  setTimeout(() => {
    init()
  }, 250);

  return (
    <div className="container">
      <Script id="tfjs" strategy='beforeInteractive' src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js"></Script>
      <Script id="teach-pose" strategy='beforeInteractive' src="https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8.3/dist/teachablemachine-pose.min.js"></Script>

      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>


      <div>
        <p>Hello World!</p>

        <div>Teachable Machine Pose Model</div>
        <div>
          <canvas id="canvas"></canvas>
        </div>
        <div id="label-container"></div>
      </div>
    </div>
  )
}
