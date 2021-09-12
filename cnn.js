import { pfGetSessionTicket, pfSubmitScore, pfGetLeaderboard } from './playfab.js';

const NN = {
	model: null,
	image: {
		width: -1,
		height: -1,
		channels: -1
	},
	numlabels: -1,
	labels: ['A block of Dominoes', 'Sunlight hitting a solar panel', 'Lightning striking a box of TNT']
};

const title = document.getElementsByClassName("title")[0];
const modal = document.getElementsByClassName("modal")[0];
const predictBtn = document.querySelector(".predictBtn>button");

var predictionInput = Math.floor(Math.random() * NN.labels.length);

start();

async function start() {
	NN.model = await tf.loadLayersModel('/network/model.json');
	NN.image.width = NN.model.inputs[0].shape[1];
	NN.image.height = NN.model.inputs[0].shape[2];
	NN.image.channels = NN.model.inputs[0].shape[3];
	NN.numlabels = NN.model.outputs[0].shape.slice(NN.model.outputs[0].shape.indexOf(','));
	//tfvis.show.modelSummary({name: 'Model Architecture'}, NN.model);
	//tfvis.show.layer({ name: 'Layer Summary', tab: 'Model Inspection'}, NN.model.getLayer(undefined, 1));
	console.log(`Successfully loaded pre-trained model with input dim '${NN.image.width},${NN.image.height},${NN.image.channels}' and '${NN.numlabels}' output labels!`);
	predictBtn.addEventListener('click', onPredict, false);
	
	showIntroScreenModalContent();
}

function getResizedCanvas (cnvs) {
	const temp_cnvs = document.createElement('canvas');
    const temp_cntx = temp_cnvs.getContext('2d');
    temp_cnvs.width = 100; 
    temp_cnvs.height = 64;
    temp_cntx.fillStyle = 'white';
    temp_cntx.fillRect(0, 0, 100, 64);
    temp_cntx.drawImage(cnvs, 0, 0, 700, 450, 0, 0, 100, 64);

	return temp_cntx;
}

function onPredict() {
	const input = [];

	predictBtn.disabled = true;

	const getInputByPixels = pixels => {
        const retArr = [];
        for (var i = 0; i < pixels.length; i += 4)
            (pixels[i] == 255 && pixels[i+1] == 255 && pixels[i+2] == 255) ? retArr.push(0) : retArr.push(1);
        return retArr
    }

	const pixels = getResizedCanvas(document.querySelector('canvas')).getImageData(0, 0, NN.image.width, NN.image.height).data;
	
	// 1d -> 2d
	const reshaped2dArr = tf.tensor1d(getInputByPixels(pixels)).reshape([NN.image.width, NN.image.height]).arraySync();

	// 2d -> 3d
	for (let x = 0; x < NN.image.width; x++) {
		for (let y = 0; y < NN.image.height; y++) {
			const val = reshaped2dArr[x][y];
			reshaped2dArr[x][y] = [val];
		}
	}

	// 3d -> 4d
	input.push(reshaped2dArr)

	const predictionArr = NN.model.predict(tf.tensor4d(input)).arraySync()[0];
	console.log(`Arr: ${predictionArr}`);
	let highestIndex = 0;
	for (let x = 0; x < predictionArr.length; x++)
		if (predictionArr[x] > predictionArr[highestIndex])
			highestIndex = x;

	const predictionOutput = Math.trunc(predictionArr[predictionInput] * 100 * 100);

	confetti({
		particleCount: 150,
		spread: 120,
		decay: 0.925,
		ticks: 500,
		startVelocity: 75,
		angle: 60,
		origin: {
			x: -0.2,
			y: 0.5
		  }
	});

	confetti({
		particleCount: 150,
		spread: 120,
		decay: 0.925,
		ticks: 500,
		startVelocity: 75,
		angle: 120,
		origin: {
			x: 1.2,
			y: 0.5
		  }
	});

	showPredictionModalContent(predictionOutput);

	predictBtn.disabled = false;

}

function showIntroScreenModalContent () {
	document.getElementsByClassName("loader")[0].style.display = "none";
	modal.innerHTML = "<div class='modalContent'><h1 class='modalTitle'><img src='images/jam.png' alt='Lux Jam' width='25' height='25'> Shawn's Azure Lux Jam entry! <img src='images/jam.png' alt='Lux Jam' width='25' height='25'></h1><p>In this game you'll be asked to draw a picture related to the event theme, chain reactions, then press the Predict button to check the accuracy of your drawing! Also, if you're lucky and get a top score you'll be added to the hiscores for that picture challenge, courtesy of Azure Playfab!</p><p>This game was possible by creating a pre-trained deep convolutional neural network seen in the <a href='images/cnn.png' target='_blank'>image</a> below:</p><br/><img src='images/cnn.png' alt='NN' width='100%'><div class='modalStart btn'>Start</div></div>";
	document.querySelector('.modalStart').addEventListener('click', hideModal, false);
	modal.style.display = "block";
}

function showPredictionModalContent (prediction) {
	const leaderboard = (predictionInput == 0) ? 'Dominoes' : ((predictionInput == 1) ? 'Sunlight' : ((predictionInput == 2) ? 'Lightning' : 'ERROR'));
	let player_id = '';
	let session_ticket = '';

	const isScoreOnLeaderboard = (leaderboardEntries) => {
		for (let i = 0; i < leaderboardEntries.length; i++)
			if (leaderboardEntries[i].StatValue == prediction)
				return true;
		return false;
	}

	pfGetSessionTicket()
		.then(data => {
			player_id = data.player_id;
			session_ticket = data.session_ticket;
			return pfSubmitScore (data.session_ticket, prediction, leaderboard);
		})
		.then(() => {
			// allow time for PlayFab to update
			setTimeout(() => {
				pfGetLeaderboard (session_ticket, leaderboard, 5)
					.then((leaderboardEntries) => {
						console.log(leaderboardEntries);
			
						const onLeaderboard = isScoreOnLeaderboard(leaderboardEntries);
			
						modal.innerHTML = `<div class='modalContent'><h1 class='modalTitle'><img src='images/1.gif' alt='Robot' width='75' height='75'>You scored ${(prediction / 100).toFixed(2)}% !<img src='images/2.gif' alt='Robot' width='75' height='75'></h1><p class='msg'>${onLeaderboard ? `Congratulations player ${player_id}, either your new score made it on the leaderboard or your old score remains in the top 5!` : `Sorry player ${player_id}, your score was not high enough to make it on the leaderboard or your old score is already higher on the leaderboard. Please try again!`}</p><table class='Title'><thead><tr><th colspan='5'>${leaderboard} Challenge <sup>resets daily</sup></th></tr></thead><tbody><tr><td>${leaderboardEntries.length > 0 ? 'Player #'.concat(leaderboardEntries[0].PlayFabId) : ''}</td><td>${leaderboardEntries.length > 0 ? (leaderboardEntries[0].StatValue / 100).toFixed(2).concat('%') : ''}</td></tr><tr><td>${leaderboardEntries.length > 1 ? 'Player #'.concat(leaderboardEntries[1].PlayFabId) : ''}</td><td>${leaderboardEntries.length > 1 ? (leaderboardEntries[1].StatValue / 100).toFixed(2).concat('%') : ''}</td></tr><tr><td>${leaderboardEntries.length > 2 ? 'Player #'.concat(leaderboardEntries[2].PlayFabId) : ''}</td><td>${leaderboardEntries.length > 2 ? (leaderboardEntries[2].StatValue / 100).toFixed(2).concat('%') : ''}</td></tr><tr><td>${leaderboardEntries.length > 3 ? 'Player #'.concat(leaderboardEntries[3].PlayFabId) : ''}</td><td>${leaderboardEntries.length > 3 ? (leaderboardEntries[3].StatValue / 100).toFixed(2).concat('%') : ''}</td></tr><tr><td>${leaderboardEntries.length > 4 ? 'Player #'.concat(leaderboardEntries[4].PlayFabId) : ''}</td><td>${leaderboardEntries.length > 4 ? (leaderboardEntries[4].StatValue / 100).toFixed(2).concat('%') : ''}</td></tr></tbody></table><div class='modalPlayAgain btn'>Play Again</div></div>`;
						document.querySelector('.modalPlayAgain').addEventListener('click', hideModal, false);
						modal.style.display = "block";
					});
			}, 1000);
		});
}

function hideModal () {
	modal.style.display = "none";
	modal.style.background = 'rgba(0, 0, 0, 0.2)';
	chooseNewPrediction();
	title.innerHTML = `Draw an image of <u>${NN.labels[predictionInput]}</u>!`;
	clearBoard();

	document.querySelector(".predictBtn").style.display = "block";
	document.querySelector(".canvas").style.display = "block";
	document.querySelector(".toolbar").style.display = "flex";
}

function chooseNewPrediction () {
	predictionInput += 1;
	if (predictionInput == NN.labels.length) {
		predictionInput = 0;
	}
}

function clearBoard() {
	const canvas = document.querySelector('canvas');
	const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 9999, 9999);
}