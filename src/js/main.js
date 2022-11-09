

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = 'https://teachablemachine.withgoogle.com/models/d_xqLGdiP/';
let model, webcam, canvas, ctx, labelContainer, maxPredictions;

let lastTimeStanding;
const totalStandingTime = 1000;
let remainingStandingTime = totalStandingTime;
let currentlyStanding = false;
let finished = false;
let inOffice = false;
let nextStepButton;

let jsConfetti; // confetti

function toggleOffice() {
    const toggleSwitch = document.getElementById("inOfficeToggle");
    if (inOffice) {
        toggleSwitch.classList.remove("toggle-handle-clicked");
        toggleSwitch.classList.add("toggle-handle");
    } else {
        toggleSwitch.classList.remove("toggle-handle");
        toggleSwitch.classList.add("toggle-handle-clicked");
    }

    inOffice = !inOffice;
}


async function init() {

    nextStepButton = document.getElementById("nextStepButton");
    nextStepButton.innerText = "Done";
    nextStepButton.disabled = true;
    nextStepButton.onclick = null;

    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';

    // load the model and metadata
    // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    const exampleGuide = document.getElementById("example-guide").getBoundingClientRect();
    webcam = new tmPose.Webcam(1280, 720, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');


    $("#example-guide")[0].src += "?autoplay=1";
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

    const canvasPixelWidht = canvas.width;
    const canvasPixelHeight = canvas.height;

    ctx.drawImage(webcam.canvas, 0, 0, canvasPixelWidht, canvasPixelHeight);


    // resize pose
    if (pose) {
        for (let index = 0; index < pose.keypoints.length; index++) {
            pose.keypoints[index].position.x = pose.keypoints[index].position.x / (1280 / canvasPixelWidht);
            pose.keypoints[index].position.y = pose.keypoints[index].position.y / (720 / canvasPixelHeight);
        }

        // finally draw the poses
        drawPose(pose);
    }

    const standingPercentage = prediction[1].probability * 100;
    processPrediction(standingPercentage);
}

function processPrediction(standingPercentage) {
    if (standingPercentage > 90) {
        let now = new Date();
        if (currentlyStanding) {
            remainingStandingTime -= now - lastTimeStanding;

            if (remainingStandingTime > 0) {
                updateTime();
            } else if (!finished) {
                remainingStandingTime = 0;
                updateTime();
                finish();
            }

        } else {
            updateTitle(true, finished);
        }
        lastTimeStanding = now;
        currentlyStanding = true;
    } else {
        currentlyStanding = false;

        if (!finished) {
            updateTitle(currentlyStanding, finished);
        }
    }
    updateState(currentlyStanding);
}

function finish() {
    finished = true;
    updateTitle(false, finished);

    nextStepButton.disabled = false;
    nextStepButton.onclick = function() { onDoneClick();}

    onDoneClick();
}

function onDoneClick() {
    jsConfetti.addConfetti({
        emojis: ['💃', '🏅', '🏃‍♀️', '🏃‍♂️', '🏋️'],
     })
}

function updateState(standing) {
    const stateElement = document.getElementById("standing-state");

    if (standing) {
        stateElement.innerText = "Standing"
    } else {
        stateElement.innerText = "Sitting"
    }
}

function updateTitle(standing, finished) {
    const titleElement = document.getElementById("title");

    if (finished) {
        titleElement.innerText = "Congratulations 🎉 You did it!"
    }
    else if (standing) {
        titleElement.innerText = "Just Keep moving 💃"
    } else {
        titleElement.innerText = "Get up for your joy moves!"
    }
}

function updateTime() {
    document.getElementById("standing-timer").innerText = "Timer: " + (remainingStandingTime / 1000).toFixed(2) + "s"
}

function drawPose(pose) {
    // draw the keypoints and skeleton
    if (pose) {
        const minPartConfidence = 0.5;
        tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
        tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }

}

$(document).ready(function () {
    updateTime();
    jsConfetti = new JSConfetti();
});
