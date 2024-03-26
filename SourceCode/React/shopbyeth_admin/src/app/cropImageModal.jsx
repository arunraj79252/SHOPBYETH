import React, { useCallback, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Cropper from "react-easy-crop";
import getCroppedImg, { testFunc } from "./getCategory";
import ReactCrop from "react-image-crop";
import { useEffect } from "react";
import { useRef } from "react";
import canvasPreview from "./canvasPreview";

// import { getCroppedImg, testFunc } from "./getCategory";
// import { test,getCroppedImg } from "./utils/cropImage";

const CropImageModal = (props) => {
  const [crop, setCrop] = useState({
    unit: "px", // Can be 'px' or '%'
    x: 25,
    y: 25,
    width: 550,
    height: 750,
  });

  const [zoom, setZoom] = useState(1);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const minZoom = 1;
  const [cropSize, setCropSize] = useState({ height: 750, width: 550 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState();
  const [croppedImage, setCroppedImage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [completedCrop, setCompletedCrop] = useState(null);
  // const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
  //   console.log(croppedArea, croppedAreaPixels);
  //   setCroppedAreaPixels(croppedAreaPixels);
  // }, []);
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [output, setOutput] = useState(null);

  // useEffect(() => {
  //   console.log(scale);
  // }, [scale]);
  // useEffect(()=>{
  //   console.log(completedCrop);
  //   console.log(imgRef.current);
  //   console.log(previewCanvasRef.current);
  // },[completedCrop])
  const cropImages = async (e) => {
    e.preventDefault();
    console.log("here");
    testFunc();
    //    await getCroppedImg(props.image, croppedAreaPixels, rotation);

    const { file, url } = await getCroppedImg(
      props.image,
      croppedAreaPixels,
      rotation
    );

    setCroppedImage(url);
    console.log(file, "filr");
    console.log(url, "url");
    console.log(file);
    const myFile = new File([file], "image.jpeg", {
      type: file.type,
    });

    console.log(myFile);
    props.setCroppedData(myFile, url);
    props.close();
    // setFile(file);
    // setOpenCrop(false);
  };
  const toBlob = async (canvas) => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((file) => {
        file.name = "cropped.jpeg";
        resolve({ file: file, url: URL.createObjectURL(file) });
      }, "image/png",0.95);
    });
  };
  const toDataUrl = async (canvas) => {
    return new Promise((resolve, reject) => {
      const url = canvas.toDataURL("image/png");
      resolve(url);
    });
  };
  const cropImage = async () => {
    const blob = await toBlob(previewCanvasRef.current);
    console.log(blob);
    const myFile = new File([blob.file], "image.png", {
      type: blob.file.type,
    });
    console.log(myFile);
    props.setCroppedData(myFile, blob.url);
    props.close();

    // imageRef.current = props.image
    // const canvas = document.createElement("canvas");
    // const scaleX = props.image.naturalWidth / props.image.width;
    // const scaleY = props.naturalHeight / props.height;
    // canvas.width = crop.width;
    // canvas.height = crop.height;
    // const ctx = canvas.getContext("2d");

    // const pixelRatio = window.devicePixelRatio;
    // canvas.width = crop.width * pixelRatio;
    // canvas.height = crop.height * pixelRatio;
    // ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    // ctx.imageSmoothingQuality = "high";

    // ctx.drawImage(
    //   crop.x * scaleX,
    //   crop.y * scaleY,
    //   crop.width * scaleX,
    //   crop.height * scaleY,
    //   0,
    //   0,
    //   crop.width,
    //   crop.height
    // );

    // // Converting to base64
    // const base64Image = canvas.toDataURL("image/jpeg");
    // setOutput(base64Image);
    
  };

  const onImageLoad = () => {
    setCompletedCrop({
      unit: "px", // Can be 'px' or '%'
      x: 25,
      y: 25,
      width: 550,
      height: 750,
    })
  };

  useEffect(() => {
    // debugger
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        scale,
        rotate
      );
    }
  }, [completedCrop, scale, rotate]);
  return (
    <Modal
     fullscreen={true}
      aria-labelledby="contained-modal-title-vcenter"
      centered
      show={props.show}
      onHide={props.close}
      className="crop-modal"
      //   dialogClassName="modal-90w"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">Crop Image</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      
        <div className="crop-containers">
          {/* <Cropper
                image={props.image}
                crop={crop}
                zoom={zoom}
                zoomWithScroll={true}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropSize={cropSize}
              /> */}
            
          <div className="row">
          <div className="col-12 d-flex justify-content-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                locked="true"
                onComplete={(c) => {
                  setCompletedCrop(c);
                }}
              >
                <img
                  ref={imgRef}
                  onLoad={onImageLoad}
                  src={props.image}
                  alt="crop-me"
                  style={{minWidth:'650px', minHeight:'750px', transform: `scale(${scale}) rotate(${rotate}deg)` }}
                />
              </ReactCrop>
            </div>
          <div className="col-12 d-flex justify-content-center">
              {completedCrop && (
                <canvas
                  
                  ref={previewCanvasRef}
                  style={{
                    border: "1px solid black",
                    objectFit: "contain",
                    width: completedCrop.width,
              height: completedCrop.height,
                    
                  }}
                />
              )}
            </div>
          
            
            
          </div>
         </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="row">
          <div className="col-lg-4">
            <label class="form-label">Scale</label>
            <input
          id="scale-input"
          type="number"
          className="form-control"
          step="0.1"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
        />
            <input
              type="range"
              className="form-range"
              min="0.1"
              max="2"
              step="0.1"
              id="customRange3"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </div>
          <div className="col-lg-4">
            <label class="form-label">Rotate</label>
            <input
          id="scale-input"
          type="number"
          value={rotate}
          className="form-control"
          onChange={(e) => setRotate(Number(e.target.value))}
        />
            <input
              type="range"
              className="form-range"
              min="-180"
              max="180"
              step="1"
              id="customRange3"
              value={rotate}
              onChange={(e) => setRotate(Number(e.target.value))}
            />
          </div>
          <div className="col-lg-4 crop-button-container">
            <div className="crop-button">
            <button className="button" onClick={cropImage}>
              Crop Image
            </button>
            </div>
            
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default CropImageModal;
