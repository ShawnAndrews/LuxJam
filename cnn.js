const NN = {
	model: null,
	image: {
		width: -1,
		height: -1,
		channels: -1
	},
	labels: -1
};

const modal = document.getElementsByClassName("modal")[0];
const predictBtn = document.querySelector(".predictBtn>button");

document.querySelector('.predictBtn>button').addEventListener('click', onPredict, false);
document.querySelector('.modalClose').addEventListener('click', () => modal.style.display = "none", false);

start();

async function start() {
	NN.model = await tf.loadLayersModel('/network/model.json');
	NN.image.width = NN.model.inputs[0].shape[1];
	NN.image.height = NN.model.inputs[0].shape[2];
	NN.image.channels = NN.model.inputs[0].shape[3];
	NN.labels = NN.model.outputs[0].shape.slice(NN.model.outputs[0].shape.indexOf(','));
	// tfvis.show.modelSummary({name: 'Model Architecture'}, NN.model);
	//tfvis.show.layer({ name: 'Layer Summary', tab: 'Model Inspection'}, NN.model.getLayer(undefined, 1));
	console.log(`Successfully loaded pre-trained model with input dim '${NN.image.width},${NN.image.height},${NN.image.channels}' and '${NN.labels}' output labels!`);
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

	console.log(`Prediction: ${highestIndex} with ${predictionArr[highestIndex] * 100}%`);

	confetti({
		particleCount: 300,
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
		particleCount: 300,
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
	
	modal.style.display = "block";

}