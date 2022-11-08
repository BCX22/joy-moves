// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = 'https://teachablemachine.withgoogle.com/models/smtioMGWF/';
let model, webcam, ctx, labelContainer, maxPredictions;

let lastTimeStanding;
let remainingStandingTime = 60000;
let currentlyStanding = false;


async function init() {
    document.getElementById('startbutton').remove();

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
    canvas.width = 1280;
    canvas.height = 720;
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
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ': ' + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }


    // finally draw the poses
    drawPose(pose);

    const standingPercentage = prediction[1].probability * 100;

    if (standingPercentage > 90) {
        let now = new Date();
        if (currentlyStanding) {
            remainingStandingTime -= now - lastTimeStanding;

            document.getElementById("standing-time").innerHTML = "" + remainingStandingTime;
            drawBar(remainingStandingTime * 100 / 60000);

        } else {
            updateTitle(true);
        }
        lastTimeStanding = now;
        currentlyStanding = true;
    } else {
        currentlyStanding = false;
        updateTitle(currentlyStanding);
    }
}

function updateTitle(standing) {
    const titleElement = document.getElementById("title");

    if (standing) {
        titleElement.innerHTML = "Congratulations 🎉 Keep moving!"
    } else {
        titleElement.innerHTML = "Get up for joy moves!"
    }
}

function drawBar(percentage) {
    const bar = document.getElementById("standing-time-bar");
    var color1 = "blue";
    var color2 = "red";
    bar.style.background = `linear-gradient(to right, ${color1}, ${percentage}%, ${color2})`;
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