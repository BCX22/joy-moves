// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = 'https://teachablemachine.withgoogle.com/models/smtioMGWF/';
let model, webcam, ctx, labelContainer, maxPredictions;

let lastTimeStanding;
const totalStandingTime = 10000;
let remainingStandingTime = totalStandingTime;
let currentlyStanding = false;
let finished = false;
let inOffice = false;

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
    document.getElementById('startbutton').remove();

    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';

    // load the model and metadata
    // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    const exampleGuide = document.getElementById("example-guide").getBoundingClientRect();
    webcam = new tmPose.Webcam(500, 280, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById('canvas');
    canvas.width = 500;
    canvas.height = 280;
    ctx = canvas.getContext('2d');
    labelContainer = document.getElementById('label-container');
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement('div'));
    }

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

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ': ' + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerText = classPrediction;
    }

    // finally draw the poses
    drawPose(pose);
    const standingPercentage = prediction[1].probability * 100;
    processPrediction(standingPercentage);
}

function processPrediction(standingPercentage) {
    if (standingPercentage > 90 && !finished) {
        let now = new Date();
        if (currentlyStanding) {
            remainingStandingTime -= now - lastTimeStanding;

            if (remainingStandingTime > 0) {
                document.getElementById("standing-time").innerText = "" + remainingStandingTime;
                drawBar();
            } else {
                remainingStandingTime = 0;
                document.getElementById("standing-time").innerText = "" + remainingStandingTime;
                drawBar();
                finish();
            }

        } else {
            updateTitle(true, finished);
        }
        lastTimeStanding = now;
        currentlyStanding = true;
    } else if (!finished) {
        currentlyStanding = false;
        updateTitle(currentlyStanding, finished);
    }
}

function finish() {
    finished = true;
    updateTitle(false, finished);

    const doneBtn = document.createElement("button");
    doneBtn.innerText = "Done"
    document.getElementById("button-div").appendChild(doneBtn);
}

function updateTitle(standing, finished) {
    const titleElement = document.getElementById("title");

    if (finished) {
        titleElement.innerText = "Congratulations 🎉 You did it!"
    }
    else if (standing) {
        titleElement.innerText = "Just Keep moving 💃"
    } else {
        titleElement.innerText = "Get up for joy moves!"
    }
}

function drawBar() {
    const percentage = remainingStandingTime * 100 / totalStandingTime;
    const bar = document.getElementById("standing-time-bar");
    var color1 = "#797979";
    var color2 = "#D4D4D4";
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