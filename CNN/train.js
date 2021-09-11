/* This file reads training images, formats them, inputs them into a CNN to create a pre-trained network file for web distribution */

import { readdirSync } from 'fs';
import * as tf from '@tensorflow/tfjs-node-gpu';

import PNG from 'png-js';
import path from 'path';

const NNData = {
    labels: [],
    image: {
        width: 100,
        height: 64,
        channels: 1
    },
    TrainQ: [],
    TrainA: [],
    ValidationQ: [],
    ValidationA: [],
    model: null
}

startTraining('train_images', 'validation_images');

// step 1: load the data
function loadImageData(directory_train_name, directory_validation_name) {

    let numOfTrainImages = 0;
    let numOfValidationImages = 0;

    const getInputByPixels = pixels => {
        const retArr = [];
        for (var i = 0; i < pixels.length; i += 4)
            (pixels[i] == 255 && pixels[i+1] == 255 && pixels[i+2] == 255) ? retArr.push(0) : retArr.push(1);
        return retArr
    }

    // get labels
    NNData.labels = readdirSync(`./${directory_train_name}`, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

    // get total number of images
    for (let i = 0; i < NNData.labels.length; i++) {
        numOfTrainImages += readdirSync(`./${directory_train_name}/${NNData.labels[i]}`).length;
        numOfValidationImages += readdirSync(`./${directory_validation_name}/${NNData.labels[i]}`).length;
    }

    // get image data
    for (let i = 0; i < NNData.labels.length; i++) {
        const trainFiles = readdirSync(`${directory_train_name}/${NNData.labels[i]}`);
        const validationFiles = readdirSync(`${directory_validation_name}/${NNData.labels[i]}`);

        for (let j = 0; j < trainFiles.length; j++) {
            PNG.decode(`./${directory_train_name}/${NNData.labels[i]}/${trainFiles[j]}`, (pixels) => {

                // 1d -> 2d
                const reshaped2dArr = tf.tensor1d(getInputByPixels(pixels)).reshape([NNData.image.width, NNData.image.height]).arraySync();

                // 2d -> 3d
                for (let x = 0; x < NNData.image.width; x++) {
                    for (let y = 0; y < NNData.image.height; y++) {
                        const val = reshaped2dArr[x][y];
                        reshaped2dArr[x][y] = [val];
                    }
                }

                // 3d -> 4d
                NNData.TrainQ.push(reshaped2dArr)
                
                NNData.TrainA.push(i);
    
                // check if image processing is complete
                if (NNData.TrainA.length == numOfTrainImages && NNData.TrainQ.length == numOfTrainImages && NNData.ValidationA.length == numOfValidationImages && NNData.ValidationQ.length == numOfValidationImages) {
                    console.log(`Step 1: Successful!`);

                    createModel();
                }
            });
        }

        for (let j = 0; j < validationFiles.length; j++) {
            PNG.decode(`./${directory_validation_name}/${NNData.labels[i]}/${validationFiles[j]}`, (pixels) => {

                // 1d -> 2d
                const reshaped2dArr = tf.tensor1d(getInputByPixels(pixels)).reshape([NNData.image.width, NNData.image.height]).arraySync();

                // 2d -> 3d
                for (let x = 0; x < NNData.image.width; x++) {
                    for (let y = 0; y < NNData.image.height; y++) {
                        const val = reshaped2dArr[x][y];
                        reshaped2dArr[x][y] = [val];
                    }
                }

                // 3d -> 4d
                NNData.ValidationQ.push(reshaped2dArr)
                
                NNData.ValidationA.push(i);
    
                // check if image processing is complete
                if (NNData.ValidationA.length == numOfValidationImages && NNData.ValidationQ.length == numOfValidationImages && NNData.TrainA.length == numOfTrainImages && NNData.TrainQ.length == numOfTrainImages) {
                    console.log(`Step 1: Successful!`);

                    createModel();
                }
            });
        }

    }

}

// step 2: train the network
function createModel() {
    NNData.model = tf.sequential();

    NNData.model.add(tf.layers.conv2d({
        inputShape: [NNData.image.width, NNData.image.height, NNData.image.channels],
        kernelSize: 3,
        filters: 32,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        padding: 'same'
    }));

    NNData.model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 32,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        padding: 'same'
    }));

    NNData.model.add(tf.layers.maxPooling2d({
        poolSize: [3, 3], strides: [2, 2]
    }));

    NNData.model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 64,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        padding: 'same'
    }));

    NNData.model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 64,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        padding: 'same'
    }));

    NNData.model.add(tf.layers.maxPooling2d({
        poolSize: [3, 3], strides: [2, 2]
    }));

    NNData.model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 128,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        padding: 'same'
    }));

    NNData.model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 128,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        padding: 'same'
    }));

    NNData.model.add(tf.layers.maxPooling2d({
        poolSize: [3, 3], strides: [2, 2]
    }));

    NNData.model.add(tf.layers.flatten());

    NNData.model.add(tf.layers.dense({
        units: 4096,
        kernelInitializer: 'varianceScaling',
        activation: 'relu'
    }));

    NNData.model.add(tf.layers.dense({
        units: 4096,
        kernelInitializer: 'varianceScaling',
        activation: 'relu'
    }));

    NNData.model.add(tf.layers.dense({
        units: NNData.labels.length,
        kernelInitializer: 'varianceScaling',
        activation: 'softmax'
    }));

    NNData.model.compile({
        optimizer: tf.train.adam(1e-5), // 0.001
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['acc'],
    });

    console.log(`Step 2: Successful!`);
    trainModel();
}

// step 3: train the NN
function trainModel() {

    NNData.model.fit(tf.tensor(NNData.TrainQ), tf.tensor(NNData.TrainA), {
        batchSize: 32,
        epochs: 10,
        shuffle: true,
        verbose: 1,
        validationData: [tf.tensor(NNData.ValidationQ), tf.tensor(NNData.ValidationA)]
    }).then(h => {
        console.log(`Step 3: Successful! ${JSON.stringify(h)}`);
        saveModel();
    });

}

// step 4: save NN to file
async function saveModel() {
    const saveLoc = `file:///${path.resolve().substring('C:/'.length).substring(0, path.resolve().length - ('C:/'.length + '/cnn'.length))}/network`;
    await NNData.model.save(saveLoc)
    console.log(`Step 4: Successful!`);
}

function startTraining(directory_train_name, directory_validation_name) {
    loadImageData(directory_train_name, directory_validation_name);
}