/**
 * @author mrdoob / http://mrdoob.com/
 */
    var rotWorldMatrix; 
    function rotateAroundWorldAxis( object, axis, radians ) {
        rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
        rotWorldMatrix.multiply(object.matrix);        // pre-multiply
        object.matrix = rotWorldMatrix;
        object.rotation.setFromRotationMatrix(object.matrix, object.order);
    } 

var Loader = function ( editor ) {
    
         
    
	var scope = this;
	var signals = editor.signals;

	this.loadFile = function ( file, file1 ) {
        var supportedExtensions = ['awd', 'babylon', 'babylonmeshdata', 'ctm', 'dae', 'js', 'json', '3geo', '3mat', '3obj', '3scn', 'obj', 'mhd', 'ply', 'stl', 'vtk'];
		var filename = file.name;
		var extension = filename.split( '.' ).pop().toLowerCase();
        if(typeof file1 != 'undefined'){
            var filenameRaw = file1.name;
            var extensionRaw = filenameRaw.split( '.' ).pop().toLowerCase();

            var buffer;
            if(supportedExtensions.indexOf(extensionRaw) > -1 && supportedExtensions.indexOf(extension) < 0){
                buffer = file;
                file = file1;
                file1 = buffer;
                buffer = extension;
                extension = extensionRaw;
                extensionRaw = buffer;
            }
        }
		switch ( extension ) {

			case 'awd':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var loader = new THREE.AWDLoader();
					var scene = loader.parse( event.target.result );

					editor.setScene( scene );

				}, false );
				reader.readAsArrayBuffer( file );

				break;

			case 'babylon':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();
					var scene = loader.parse( json );

					editor.setScene( scene );

				}, false );
				reader.readAsText( file );

				break;

			case 'babylonmeshdata':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();

					var geometry = loader.parseGeometry( json );
					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'ctm':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var data = new Uint8Array( event.target.result );

					var stream = new CTM.Stream( data );
					stream.offset = 0;

					var loader = new THREE.CTMLoader();
					loader.createModel( new CTM.File( stream ), function( geometry ) {

						geometry.sourceType = "ctm";
						geometry.sourceFile = file.name;

						var material = new THREE.MeshPhongMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.addObject( mesh );
						editor.select( mesh );

					} );

				}, false );
				reader.readAsArrayBuffer( file );

				break;

			case 'dae':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var parser = new DOMParser();
					var xml = parser.parseFromString( contents, 'text/xml' );

					var loader = new THREE.ColladaLoader();
					loader.parse( xml, function ( collada ) {

						collada.scene.name = filename;

						editor.addObject( collada.scene );
						editor.select( collada.scene );

					} );

				}, false );
				reader.readAsText( file );

				break;

			case 'js':
			case 'json':

			case '3geo':
			case '3mat':
			case '3obj':
			case '3scn':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					// 2.0

					if ( contents.indexOf( 'postMessage' ) !== -1 ) {

						var blob = new Blob( [ contents ], { type: 'text/javascript' } );
						var url = URL.createObjectURL( blob );

						var worker = new Worker( url );

						worker.onmessage = function ( event ) {

							event.data.metadata = { version: 2 };
							handleJSON( event.data, file, filename );

						};

						worker.postMessage( Date.now() );

						return;

					}

					// >= 3.0

					var data;

					try {

						data = JSON.parse( contents );

					} catch ( error ) {

						alert( error );
						return;

					}

					handleJSON( data, file, filename );

				}, false );
				reader.readAsText( file );

				break;
            /* New and changed obj reader for this project */
			case 'obj':
                
				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {
                    
					var contents = event.target.result;
                    
					var object = new THREE.OBJLoader().parse( contents );
                    
                    var vertexAvgX = 0, 
                        vertexAvgY = 0, 
                        vertexAvgZ = 0;
                    
                    // Get mesh and add color to the mesh
                    
                    object.traverse(function(child){
                        if(child instanceof THREE.Mesh){
                            child.material.color.setRGB(1,0,0);
                            child.material.side = THREE.BackSide;
                        }
                        
                        if(child.geometry !== undefined){
                            var geometry = child.geometry;
                            var vertices = geometry.attributes.position.array;
                            //geometry.computeVertexNormals();
                            for(ij = 0; ij < geometry.attributes.normal.array.length; ij++){
                                geometry.attributes.normal.array[ij] = -geometry.attributes.normal.array[ij];
                            }
                            
                            
                            for(var i = 0; i < vertices.length; i = i + 3){
                                vertexAvgX = vertexAvgX + vertices[i];
                                vertexAvgY = vertexAvgY + vertices[i+1];
                                vertexAvgZ = vertexAvgZ + vertices[i+2];
                                
                            }
                            vertexAvgX = Math.round(vertexAvgX / (vertices.length / 3) * 10) / 10;
                            vertexAvgY = Math.round(vertexAvgY / (vertices.length / 3) * 10) / 10;
                            vertexAvgZ = Math.round(vertexAvgZ / (vertices.length / 3) * 10) / 10;
                            
                            
                            
                            geometry.attributes.position.needsUpdate = true;
                            for(var i = 0; i < vertices.length; i = i + 3){
                                //console.log(vertices[i] + " " + vertices[i+1] + " " + vertices[i+2]);
                                vertices[i] = vertices[i] - vertexAvgX;
                                vertices[i+1] = vertices[i+1] - vertexAvgY;
                                vertices[i+2] = vertices[i+2] - vertexAvgZ;
                            }

                        }
                        
                    });
                    
					object.name = filename;
                    //object.rotation.set(Math.PI/180 * -90, Math.PI/180 * -45, Math.PI/180 * -135);
                    //object.rotation.set(Math.PI/180 * -90, 1, 1);
                    // rotate around x axis
                    /*var quaternionX = new THREE.Quaternion();
                    quaternionX.setFromAxisAngle(new THREE.Vector3( 1, 0, 0 ), Math.PI/180 * -180); // axis must be normalized, angle in radians
                    object.quaternion.multiplyQuaternions( quaternionX, object.quaternion );*/
                    
                    
					editor.addObject( object );
                    sceneObject = editor.scene.getObjectByName(filename);
                    myCamera = editor.camera;
                    //change initial rotation
                    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 1, 0 ), Math.PI/180 * -87.5 );
                    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 0, 1 ), Math.PI/180 * -45 );
                    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 1, 0 ), Math.PI/180 * -45 );
                    
                    var light = new THREE.PointLight( 0xffffff, 1, 0 ); 
                    // color, intensity, distance
                    light.name = 'InitPointLight';
                    
                    light.position.set(editor.camera.position.x, editor.camera.position.y, editor.camera.position.z + 10);
                    editor.addObject( light );
                    editor.camera.lookAt(new THREE.Vector3(0,0,0));         
                    cameraStartPosition = editor.camera.position.toArray();
                    
                    //define camera controls
                    
                    
                    
                    // x is red, y is green z is blue
                    var axis = new THREE.AxisHelper(100);
                    editor.scene.add(axis);
                    
                    
                    //console.log("camera position: x = " + editor.camera.position.x + "; y = " + editor.camera.position.y + "; z = " + editor.camera.position.z);
                    /*var controls = new THREE.OrbitControls(editor.camera);
                    controls.damping = 0.2;
				    controls.addEventListener( 'change', render );*/
                    

				}, false );
				reader.readAsText( file );

				break;
                
            case 'mhd':
                if(typeof file1 === 'undefined'){
                    alert("You have to select a mhd file and its corresponding raw file in order for us to open the 3D model.");
                }
                else{
                    var reader = new FileReader();
                    reader.addEventListener( 'load', function (event) {
                        
                        var contents = event.target.result;
                        mhdContent = {
                            Nx: null, Ny: null, Nz: null, // int
                            dx: null, dy: null, dz: null, // double
                            tx: null, ty: null, tz: null, // double
                            rotationMatrix: null, // double matrix 4x4
                            elementByteOrder: null, // boolean
                            elementType: null, //string
                            rawFile: null // string
                        };
                        
                        //matrixSize = contents.length;
                        //alert(matrixSize);


                        contents = contents.replace(/=/g,' ').replace(/\s\s+/g, ' ').trim().split( " " );
                        var i = 0;
                        while(i < contents.length){
                            switch (contents[i]) {
                                case "ObjectType":
                                    i++;
                                    break;
                                case "NDims":
                                    i++;
                                    break;
                                case "DimSize":
                                    mhdContent.Nx = parseInt(contents[i+1]);
                                    mhdContent.Ny = parseInt(contents[i+2]);
                                    mhdContent.Nz = parseInt(contents[i+3]);
                                    console.log("dim size before : " + i);
                                    i+=3;
                                    console.log("dim size after : " + i);
                                    break;
                                case "ElementSpacing":
                                    mhdContent.dx = parseFloat(contents[i+1]);
                                    mhdContent.dy = parseFloat(contents[i+2]);
                                    mhdContent.dz = parseFloat(contents[i+3]);
                                    i+=3;
                                    break;
                                case "Position":
                                    mhdContent.tx = parseFloat(contents[i+1]);
                                    mhdContent.ty = parseFloat(contents[i+2]);
                                    mhdContent.tz = parseFloat(contents[i+3]);
                                    i+=3;
                                    break;
                                case "Orientation":
                                    mhdContent.rotationMatrix = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
                                    for(var j = 0; j < 4; j++){
                                        for(var k = 0; k < 4; k++){
                                            if(j >= 3 || k >= 3){
                                                mhdContent.rotationMatrix[j][k] = ((j == k) ? 1 : 0);
                                            }
                                            else{
                                                mhdContent.rotationMatrix[j][k] = parseFloat(contents[i+1]);
                                                i+=1;
                                            }
                                        }
                                    }
                                    for(var j = 0; j < 4; j++){
                                        //console.log("row number " + j + ":   " + mhdContent.rotationMatrix[j][0] + " " + mhdContent.rotationMatrix[j][1] + " " + mhdContent.rotationMatrix[j][2] + " " + mhdContent.rotationMatrix[j][3]);
                                    }
                                    break;
                                case "AnatomicalOrientation":
                                    i+=1;
                                    break;
                                case "ElementByteOrderMSB":
                                    mhdContent.elementByteOrder = (( "false" == contents[i+1].toLowerCase()) ? false : true);
                                    i+=1;
                                    break;
                                case "ElementType":
                                    mhdContent.elementType = contents[i+1]; 
                                    i+=1;
                                    break;
                                case "ElementDataFile":
                                    mhdContent.rawFile = contents[i+1]; 
                                    i+=1; 
                                    break;
                            }
                            i++;
                        }
                        if(mhdContent.rawFile != file1.name){
                            alert("The second file does not match the raw file defined in the mhd file.");    
                        }else{
                            //get content of second file and initiate kernel   
                            
                            //FileReader.readAsBinaryString(Blob|File): The result property will contain the file/blob's data as a binary string. Every byte is represented by an integer in the range of 0 to 255.
                            start = 0;
                            end = file1.size; // this is a blob 
                            rawDataFromFile = "";
                            // start and end byte 
                            //console.log("going in");
                            rawReader.readAsBinaryString(file1);
                            
                        }

                    }, false);
                    
                    var rawReader = new FileReader();
                    
                    rawReader.addEventListener( 'load', function (event) {
                        var rawData = event.target.result;
                        //console.log("going into init");
                        marchingCubesInit(mhdContent, rawData);
                        

                    }, false);
                    
                    reader.readAsText( file );
                }
                break;
                
			case 'ply':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {
                    
					var contents = event.target.result;

					var geometry = new THREE.PLYLoader().parse( contents );
					geometry.sourceType = "ply";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'stl':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.STLLoader().parse( contents );
					geometry.sourceType = "stl";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );

				if ( reader.readAsBinaryString !== undefined ) {

					reader.readAsBinaryString( file );

				} else {

					reader.readAsArrayBuffer( file );

				}

				break;

			/*
			case 'utf8':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.UTF8Loader().parse( contents );
					var material = new THREE.MeshLambertMaterial();

					var mesh = new THREE.Mesh( geometry, material );

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsBinaryString( file );

				break;
			*/

			case 'vtk':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.VTKLoader().parse( contents );
					geometry.sourceType = "vtk";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'wrl':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var result = new THREE.VRMLLoader().parse( contents );

					editor.setScene( result );

				}, false );
				reader.readAsText( file );

				break;

			default:

				alert( 'Unsupported file format (' + extension +  ').' );

				break;

		}

	}

	var handleJSON = function ( data, file, filename ) {

		if ( data.metadata === undefined ) { // 2.0

			data.metadata = { type: 'Geometry' };

		}

		if ( data.metadata.type === undefined ) { // 3.0

			data.metadata.type = 'Geometry';

		}

		if ( data.metadata.version === undefined ) {

			data.metadata.version = data.metadata.formatVersion;

		}

		if ( data.metadata.type === 'BufferGeometry' ) {

			var loader = new THREE.BufferGeometryLoader();
			var result = loader.parse( data );

			var mesh = new THREE.Mesh( result );

			editor.addObject( mesh );
			editor.select( mesh );

		} else if ( data.metadata.type.toLowerCase() === 'geometry' ) {

			var loader = new THREE.JSONLoader();
			var result = loader.parse( data );

			var geometry = result.geometry;
			var material;

			if ( result.materials !== undefined ) {

				if ( result.materials.length > 1 ) {

					material = new THREE.MeshFaceMaterial( result.materials );

				} else {

					material = result.materials[ 0 ];

				}

			} else {

				material = new THREE.MeshPhongMaterial();

			}

			geometry.sourceType = "ascii";
			geometry.sourceFile = file.name;

			var mesh;

			if ( geometry.animation && geometry.animation.hierarchy ) {

				mesh = new THREE.SkinnedMesh( geometry, material );

			} else {

				mesh = new THREE.Mesh( geometry, material );

			}

			mesh.name = filename;

			editor.addObject( mesh );
			editor.select( mesh );

		} else if ( data.metadata.type.toLowerCase() === 'object' ) {

			var loader = new THREE.ObjectLoader();
			var result = loader.parse( data );

			if ( result instanceof THREE.Scene ) {

				editor.setScene( result );

			} else {

				editor.addObject( result );
				editor.select( result );

			}

		} else if ( data.metadata.type.toLowerCase() === 'scene' ) {

			// DEPRECATED

			var loader = new THREE.SceneLoader();
			loader.parse( data, function ( result ) {

				editor.setScene( result.scene );

			}, '' );

		}

	};

}

function marchingCubesInit(mhdData, rawData){
    //console.log("mhdData: " + mhdData.rawFile + " rawData " + rawData.length);
    
        if(window.webcl == undefined) {
        alert("Unfortunately your system does not support WebCL. " +
              "Make sure that you have both the OpenCL driver " +
              "and the WebCL browser extension installed.");
        return false;
    }
 
    // Get a list of available CL platforms, and another list of the
    // available devices on each platform. If there are no platforms,
    // or no available devices on any platform, then we can conclude
    // that WebCL is not available.
    
    try {
        
        console.log("started");
        
        var platforms = webcl.getPlatforms();
        var devices = [];
        for (var i in platforms) {
            var plat = platforms[i];
            devices[i] = plat.getDevices();
        }
        //alert(devices[0].length);
        //alert(devices[0][0].getInfo(WebCL.DEVICE_NAME));
        
        var device = null;
        
        for( var i = 0; i < devices.length; i++){
            for( var j = 0; j < devices[i].length; j++){
                device_type = devices[i][j].getInfo(webcl.DEVICE_TYPE);
                if (device_type == webcl.DEVICE_TYPE_GPU) {
                    device = devices[i][j];
                    break;
                    // what happens if nvidia before intel and what if after
                }
            }
        }
        device = devices[0][0]; // delete if you want nvidia
        console.log("device: " + device.getInfo(WebCL.DEVICE_NAME));
        
        var ctx = webcl.createContext(
            device
        );
        var cmdQueue = ctx.createCommandQueue(device);
        
        //alert(device.getInfo(WebCL.DEVICE_NAME));
        
        var programSrc = loadProgram("clMarchingCubes");
        var program = ctx.createProgram(programSrc);

        //alert((ctx.getInfo(webcl.CONTEXT_DEVICES))[0].getInfo(WebCL.DEVICE_NAME));

        try {
          program.build ([device], "");
        } catch(e) {
          alert ("Failed to build WebCL program. Error "
                 + program.getBuildInfo (device, 
                                                WebCL.PROGRAM_BUILD_STATUS)
                 + ":  " 
                 + program.getBuildInfo (device, 
                                                WebCL.PROGRAM_BUILD_LOG));
          throw e;
        }
        

        
        //var matrix1D = new Array(rawData.length/2),
        var matrix1D = new ArrayBuffer(rawData.length*2);
        
        var matrix1DView = new Float32Array(matrix1D);
        
        console.log("Transforming and doing initial calculations");
        //console.log(matrix1D.byteLength);
        
        var rawLenght = rawData.length;
        
        /*-----------------------RAZDELI NA VEČ DELOV ---------------------------*/
        /*RAW DATA = 200MB
        /*matrix1DArray = 100M elements and 400MB
        /*-----------------------------------------------------------------------*/
        console.log("dimensions: " + mhdContent.Nx + " " + mhdContent.Ny + " " + mhdContent.Nz);
        var sizeOfPart = 0, //number of elements
            numberOfParts = 2,
            dataArrayLength = matrix1DView.length, //number of elements
            startOfPart = 0,
            endOfPart = 0,
            currPartSize = 0,
            j = 0;
        
        
        while(true){
            if(((matrix1DView.length % numberOfParts) == 0) && ((matrix1DView.length / numberOfParts) <=  51118080))
                break;
            numberOfParts = numberOfParts + 1;
        }
        
        var sizeOfPart = matrix1DView.length/numberOfParts,
            slicesArray = new Array(numberOfParts),
            limitForLastElement = sizeOfPart * (numberOfParts - 1);

        for(var i = 0; i < dataArrayLength; i+=sizeOfPart){
            
            startOfPart = i;
            
            if(i < limitForLastElement){
                endOfPart = i+sizeOfPart-1;
            }else{
                endOfPart = dataArrayLength-1;
            }
            
            currPartSize = endOfPart - startOfPart + 1;

            slicesArray[j] = new Array(startOfPart, endOfPart, currPartSize);
            console.log(slicesArray[j][0] + " " + slicesArray[j][1] + " " + slicesArray[j][2]);
            j = j + 1;
        }
        
        /*-------------------------------------------------------------*/
        /*----------------------- MAIN LOOP ---------------------------*/
        /*-------------------------------------------------------------*/
        
        var globalMemoryArray = new Array(numberOfParts),
            histogramArray = new Array(numberOfParts),
            histogramSum = new Array(256),
            sigma = 50/100,
            threshold = 50/100;
        
        for(var i = 0; i < 256; i++)
            histogramSum[i] = 0;
        
        //threshold = 0.01;
        
        
        for(k = 0; k < slicesArray.length; k++){
            
            var buffer1,
                buffer2,
                i = slicesArray[k][0]*2,
                j = 0;
            while(i < (slicesArray[k][1]+1)*2){
                buffer1 = rawData[i].charCodeAt(0);
                buffer2 = rawData[i+1].charCodeAt(0);
                buffer2<<=8;
                buffer2+=buffer1;
                matrix1DView[j] = buffer2;
                j = j + 1;
                i = i + 2;
            }

            var gaussSize = Math.floor(2 * Math.ceil(3 * sigma / mhdContent.dx) + 1);
            var dimensions = new Array( mhdContent.Nx , mhdContent.Ny , mhdContent.Nz, gaussSize, (slicesArray[k][2]));        
            var dimensionsMemory = locateMemoryInt(dimensions, webcl.MEM_READ_WRITE, cmdQueue, ctx);


            // locateMemory for Matrix
            globalMemoryArray[k] = ctx.createBuffer(webcl.MEM_READ_WRITE, (slicesArray[k][2])*4);
            cmdQueue.enqueueWriteBuffer(globalMemoryArray[k], true, 0, (slicesArray[k][2])*4, matrix1DView);

            console.log("execGauss3D");
            execGauss3D(sigma, program, ctx, cmdQueue, dimensionsMemory, globalMemoryArray[k], mhdContent);

            console.log("finished gauss");

            console.log("finding max");
            var max = execFindMax(device, program, ctx, cmdQueue, dimensionsMemory, globalMemoryArray[k]);
            console.log("max is: " + max);

            console.log("otsuTreshold");
            if (threshold <= 0.1)
                histogramArray[k] = execOtsuHistogram(device, program, max, ctx, cmdQueue, dimensionsMemory, globalMemoryArray[k]); //int buffer
            console.log("finished otsu");

            console.log("Cleaning up");
        }
        
        if(threshold <= 0.1){
            for(var i = 0; i < numberOfParts; i++){
                for(j = 0; j < 256; j++){
                    histogramSum[j] = histogramSum[j] + histogramArray[i][j];
                }
            }
            
            threshold = thresholdFromHistogram(histogramSum, mhdContent.Nx * mhdContent.Ny * mhdContent.Nz);
        }
        
        
        
       /* var histogramGauss2 = new Float32Array((slicesArray[1][2]));
        try {
            cmdQueue.enqueueReadBuffer(globalMemoryArray[1], true, 0, slicesArray[1][2]*4, histogramGauss2); //in bits
        } catch(ex) {
            throw "Couldn't read the buffer. " + ex;
        }
        
        histTemp = " ";
        for(var i = 0; i < histogramGauss2.length; i+=1000000)
            histTemp = histTemp + histogramGauss2[i] + " ";

        console.log(histTemp);*/

        /*-------------------------------------------------------------*/
        /*-------- MARCHING CUBES AND MODEL CONSTRUCTION --------------*/
        /*-------------------------------------------------------------*/
        var triangleArray = new Array(numberOfParts),
            normalArray = new Array(numberOfParts),
            numOfTriangles = 0,
            results;
        
        var temp = " " ;
        for(var i = 0; i < numberOfParts; i++){

            console.log("slice size: " + slicesArray[i][2]);
            console.log(i);
            results = null;
            results = execMarchingCubes(threshold, program, max, cmdQueue, ctx, (slicesArray[i][2]), dimensionsMemory, globalMemoryArray[i]);
        
            numOfTriangles += results[0][0];
            triangleArray[i] = results[1];
            normalArray[i] = results[2];
        }
        
        temp = " ";

        //console.log("st trikotnikov: " + numOfTriangles + " dolzina prvega dela: " + triangleArray[0].length + " dolzina drugega dela: " + triangleArray[1].length + " " + normalArray[0].length + " " + normalArray[1].length);

        
        var allTriangleArray = new Array(),
            allNormalArray = new Array(),
            tmp;
        
        for(var i = 0; i < numberOfParts; i++){
            tmp = Array.from(triangleArray[i]);
            allTriangleArray = allTriangleArray.concat(tmp);
            tmp = Array.from(normalArray[i]);
            allNormalArray = allNormalArray.concat(tmp);
        }
        
        /*var tmpString = " " ;
        for(var i = 0; i < allTriangleArray.length; i+=100000)
            tmpString = tmpString + allTriangleArray[i] + " ";
        console.log(tmpString);*/
        
        constructVBO(numOfTriangles, allTriangleArray, allNormalArray, threshold);
        //webcl.releaseAll();
        
    } catch (e) {
        alert(e.message);
    }
    
}


        /*var arraySize2 = rawLenght/4; 
        var histogramGauss2 = new Float32Array(arraySize2);
        
        try {
            cmdQueue.enqueueReadBuffer(matrixMemory, true, 0, rawLenght, histogramGauss2); //in bits
        } catch(ex) {
            throw "Couldn't read the buffer. " + ex;
        }
        
        for(var i = 54881318/2; i < 54881330/2; i++)
            console.log(histogramGauss2[i]);*/


// returns the program source code
function loadProgram(id){
  var kernelElement = document.getElementById(id);
  var kernelSource = kernelElement.text;
  if (kernelElement.src != "") {
      var mHttpReq = new XMLHttpRequest();
      mHttpReq.open("GET", kernelElement.src, false);
      mHttpReq.send(null);
      kernelSource = mHttpReq.responseText;
  } 
  return kernelSource;
}

// locates memory (saves value to buffer) 
// data = typed array
function locateMemory(data, flags, queue, ctx){
        var buffer = new ArrayBuffer(data.length * 4); //float has 4 bytes, it's a float buffer
        
        var bufferView = new Float32Array(buffer);//float
        
        var functionBuffer = ctx.createBuffer(flags, data.length * 4);
        
        for(i = 0; i < data.length; i++)
            bufferView[i] = data[i];
        
        // Write the buffer to OpenCL device memory
        queue.enqueueWriteBuffer(functionBuffer, false, 0, data.length * 4, bufferView);
        return functionBuffer;
}

function locateMemoryInt(data, flags, queue, ctx){
        var buffer = new ArrayBuffer(data.length * 4); //float has 4 bytes, it's a float buffer
        
        var bufferView = new Int32Array(buffer);//int
        
        var functionBuffer = ctx.createBuffer(flags, data.length * 4);
        
        for(i = 0; i < data.length; i++)
            bufferView[i] = data[i];
        
        // Write the buffer to OpenCL device memory
        queue.enqueueWriteBuffer(functionBuffer, false, 0, data.length * 4, bufferView);
        return functionBuffer;
}


function copyMemory(srcMem, queue, ctx){
    
        var memSize = srcMem.getInfo(webcl.MEM_SIZE);
        var dstMem = ctx.createBuffer(webcl.MEM_READ_WRITE, memSize);
        queue.enqueueCopyBuffer(srcMem, dstMem, 0, 0, memSize, null, null);
		return dstMem;
}

//
function execGauss3D(sigma, program, ctx, cmdQueue, dimensionsMemory, matrixMemory, mhdContent, start, end) {
        
		if (sigma < 0.1)
			return;
    
        // Init kernels
        var gaussXKernel = program.createKernel('gaussX');
        var gaussYKernel = program.createKernel('gaussY');
        var gaussZKernel = program.createKernel('gaussZ');
 
    
    
        var kernelMem = locateMemory(getGauss1DKernel(sigma), webcl.MEM_READ_WRITE, cmdQueue, ctx);
        var tmpMemory = copyMemory(matrixMemory, cmdQueue, ctx);
    
        gaussXKernel.setArg(0, tmpMemory);
        gaussXKernel.setArg(1, dimensionsMemory);
        gaussXKernel.setArg(2, kernelMem);
        gaussXKernel.setArg(3, matrixMemory);
        //return false;
    
        try{
            enqueueKernel(gaussXKernel, new Array(mhdContent.Nx, mhdContent.Ny, mhdContent.Nz), cmdQueue);
        }catch(e){
            alert(e);
        }
        
    
        gaussYKernel.setArg(0, matrixMemory);
        gaussYKernel.setArg(1, dimensionsMemory);
        gaussYKernel.setArg(2, kernelMem);
        gaussYKernel.setArg(3, tmpMemory);
    
        try{
            enqueueKernel(gaussYKernel, new Array(mhdContent.Nx, mhdContent.Ny, mhdContent.Nz), cmdQueue);
        }catch(e){
            alert("message: " + e);
        }
    
        gaussZKernel.setArg(0, tmpMemory);
        gaussZKernel.setArg(1, dimensionsMemory);
        gaussZKernel.setArg(2, kernelMem);
        gaussZKernel.setArg(3, matrixMemory);
    
        try{
            enqueueKernel(gaussZKernel, new Array(mhdContent.Nx, mhdContent.Ny, mhdContent.Nz), cmdQueue);
        }catch(e){
            alert("message: " + e);
        }
    
        tmpMemory.release();
        kernelMem.release();
        gaussXKernel.release();
        gaussYKernel.release();
        gaussZKernel.release();
        cmdQueue.flush();
    
	}

function execFindMax(device, program, ctx, cmdQueue, dimensionsMemory, matrixMemory){
    
        // ali sploh uporabim ta buffer? 
        var MAX_COMPUTE_UNITS = device.getInfo(webcl.DEVICE_MAX_COMPUTE_UNITS);
        console.log("device max compute units: " + MAX_COMPUTE_UNITS);
        var LOCAL_MEM_SIZE = device.getInfo(webcl.DEVICE_LOCAL_MEM_SIZE);
        console.log("device max mem size: " + LOCAL_MEM_SIZE);
        var MAX_WORK_GROUP_SIZE =  device.getInfo(webcl.DEVICE_MAX_WORK_GROUP_SIZE);
        console.log("device max work group size: " + MAX_WORK_GROUP_SIZE);
    
        // these are all ints
        var nLocalWorkItems = MAX_WORK_GROUP_SIZE;
		var nWorkGroups = LOCAL_MEM_SIZE * (MAX_COMPUTE_UNITS + 2) / (nLocalWorkItems * 4);
		var nGlobalWorkItems = nLocalWorkItems * nWorkGroups;
    
        var findMax = program.createKernel('findMax');
    
        var maxMemory = ctx.createBuffer(webcl.MEM_READ_WRITE, nWorkGroups * 4);
        
        
        var nLocalWorkItemsBuffer = new ArrayBuffer(4); //float has 4 bytes, it's a float buffer
        var nLocalWorkItemsBufferView = new Uint32Array(nLocalWorkItemsBuffer);//int
        nLocalWorkItemsBufferView[0] = nLocalWorkItems;
        //var nLocalWorkItemsBufferIn = ctx.createBuffer(webcl.MEM_READ_WRITE, 4);
        //cmdQueue.enqueueWriteBuffer(nLocalWorkItemsBufferIn, false, 0, 4, nLocalWorkItemsBufferView);
    
        findMax.setArg(0, matrixMemory);
        findMax.setArg(1, dimensionsMemory);
        findMax.setArg(2, nLocalWorkItemsBufferView);
        findMax.setArg(3, maxMemory);
    
        
        var globalWorkItemsArray = new Array(1);
        globalWorkItemsArray[0] = nGlobalWorkItems;
    
        var locallWorkItemsArray = new Array(1);
        locallWorkItemsArray[0] = nLocalWorkItems;
        try{
            //enqueueKernel(findMax, new Array(nGlobalWorkItems), cmdQueue);
            cmdQueue.enqueueNDRangeKernel(findMax,1, null, globalWorkItemsArray, locallWorkItemsArray);
        }catch(e){
            alert(e);
        }
    
        var data = new Float32Array(nWorkGroups);
        try {
            cmdQueue.enqueueReadBuffer(maxMemory, true, 0, nWorkGroups*4, data);
        } catch(ex) {
            throw "Couldn't read the buffer. " + ex;
        }
        var max = 0;
        for(var i = 0; i < data.length; i++){
            if(data[i] > max)
                max = data[i];
        }
    
        findMax.release();
        maxMemory.release();
        cmdQueue.flush();
        return max;
}

//returns int buffer
function execOtsuHistogram(device, program, max, ctx, cmdQueue, dimensionsMemory, matrixMemory) { 
    
    console.log("otsu histogram");
    var localGroupSize = 64; // HISTOGRAM_LOCAL_SIZE;
    
    var otsuHistogram = program.createKernel('otsuHistogram');
    
    var maxValueMemoryArrayBuffer = new ArrayBuffer(4);
    var maxValueMemoryArrayBufferView = new Float32Array(maxValueMemoryArrayBuffer);
    maxValueMemoryArrayBufferView[0] = max;
    var maxValueMemory = ctx.createBuffer(webcl.MEM_READ_WRITE,4);
    cmdQueue.enqueueWriteBuffer(maxValueMemory, true, 0, 4, maxValueMemoryArrayBufferView);

    var otsuBuffSize = 256 * 4;
    var otsuHistogramMemoryArrayBuffer = new ArrayBuffer(otsuBuffSize);
    var otsuHistogramMemoryArrayBufferView = new Int32Array(otsuHistogramMemoryArrayBuffer);
    for(var i = 0; i < 256; i++)
        otsuHistogramMemoryArrayBufferView[i] = 0;
    var otsuHistogramMemory = ctx.createBuffer(webcl.MEM_READ_WRITE, otsuBuffSize);
    cmdQueue.enqueueWriteBuffer(otsuHistogramMemory, true, 0, otsuBuffSize, otsuHistogramMemoryArrayBufferView);
    
    
    otsuHistogram.setArg(0, matrixMemory);
    otsuHistogram.setArg(1, dimensionsMemory);
    otsuHistogram.setArg(2, maxValueMemory);
    otsuHistogram.setArg(3, otsuHistogramMemory);
    
    var globalWorkItemsArray = new Array(1);
    globalWorkItemsArray[0] = (localGroupSize * 10000); // number of work items, the global and constant memory is shared through all work items
    //get_global_id(dim) returns the global position of a work item (dim is dimension index, 0,1,2 ... ) 
    //The above call is equivalent to get_local_size(dim)*get_group_id(dim) + get_local_id(dim). 
    //get_local_size(dim) is the group size in dim
    //get_group_id(dim) is the group position in dim relative to all other groups (globally) 
    //get_local_id(dim) is the position of a work item relative to the group

    var locallWorkItemsArray = new Array(1);
    locallWorkItemsArray[0] = localGroupSize;
    
    console.log(globalWorkItemsArray[0] + " " + locallWorkItemsArray[0]);
    try{
        //global_work_size – the global number of work-items in N dimensions i.e. the size of the problem.
        //local_work_size – the number of work-items that make up a work-group.
        cmdQueue.enqueueNDRangeKernel(otsuHistogram,1, null, globalWorkItemsArray, locallWorkItemsArray);
    }catch(e){
        alert(e.message);
    }
    
    var histogram = new Int32Array(256);
    try {
        cmdQueue.enqueueReadBuffer(otsuHistogramMemory, true, 0, 256*4, histogram);
    } catch(ex) {
        throw "Couldn't read the buffer. " + ex;
    }
    
    /*var histVal = " ";
    for(var i = 0; i < histogram.length; i++)
        histVal = histVal + histogram[i] + " ";
    console.log(histVal);*/
    
    otsuHistogram.release();
    maxValueMemory.release();
    otsuHistogramMemory.release();
    cmdQueue.flush();
    return histogram;
}

function thresholdFromHistogram(buffer, nValues){ //Int32Array and int
    
    var frequences = new Array(256),
        w = new Array(256),
        m = new Array(256);
    
    
    for(var i = 0; i < frequences.length; i++){
        frequences[i] = buffer[i] / nValues;
        w[i] = 0;
        m[i] = 0;
    }
    
    w[0] = frequences[0];
    for(var i = 1; i < m.length; i++){
        w[i] = w[i - 1] + frequences[i];
        m[i] = m[i - 1] + i * frequences[i];   
        //console.log("w[i] : " + w[i] + " m[i] : " + m[i] + " frequences[i] : " + frequences[i]);
    }
    
    var mean = m[255],
        tmpMax = 0,
        tmpMax2 = 0,
        threshold = 0,
        threshold2 = 0;
    
    for(var i = 0; i < 256; i++){
        bcv = mean * w[i] - m[i];
        bcv *= bcv / (w[i] * (1 - w[i]));
        if (tmpMax < bcv) {
            tmpMax = bcv;
            threshold = i;
        }
        if (tmpMax > bcv && tmpMax2 < bcv) {
            threshold2 = i;
        }
    }
    
    
    threshold = (threshold + threshold2) / 2;
    return threshold / 256.0;
}

// returns object array
function execMarchingCubes(threshold, program, max, cmdQueue, ctx, lengthOfData, dimensionsMemory, matrixMemory) {
    var marchingKernel = program.createKernel('marchingCubes');
    var maxThreshArray = new Array(max, threshold);
    var maxThreshMemory = locateMemory(maxThreshArray, webcl.MEM_READ_WRITE, cmdQueue, ctx);
    
    console.log(threshold);
    
    var trianglesMemory = ctx.createBuffer(webcl.MEM_READ_WRITE, Math.floor(lengthOfData / 1.25));
    var normalsMemory = ctx.createBuffer(webcl.MEM_READ_WRITE, Math.floor(lengthOfData / 1.25));
    
    var nTrianglesMemoryArray = new Array(1);
    nTrianglesMemoryArray[0] = 0;
    var nTrianglesMemory = locateMemoryInt(nTrianglesMemoryArray, webcl.MEM_READ_WRITE, cmdQueue, ctx);
    
    
    
    marchingKernel.setArg(0, matrixMemory);
    marchingKernel.setArg(1, dimensionsMemory);
    marchingKernel.setArg(2, maxThreshMemory);
    marchingKernel.setArg(3, trianglesMemory);
    marchingKernel.setArg(4, normalsMemory);
    marchingKernel.setArg(5, nTrianglesMemory);
    

    enqueueKernel(marchingKernel, new Array(mhdContent.Nx, mhdContent.Ny, mhdContent.Nz), cmdQueue);

    
    var nTrianglesBuff = new Int32Array(1);
    try {
        cmdQueue.enqueueReadBuffer(nTrianglesMemory, true, 0, 4, nTrianglesBuff);
    } catch(ex) {
        throw "Couldn't read the buffer. " + ex;
    }
    
    var trianglesBuff = new Float32Array(nTrianglesBuff[0] * 9);
    try {
        cmdQueue.enqueueReadBuffer(trianglesMemory, true, 0, nTrianglesBuff[0] * 9 * 4, trianglesBuff);
    } catch(ex) {
        throw "Couldn't read the buffer. " + ex;
    }
    
    var normalsBuff = new Float32Array(nTrianglesBuff[0] * 9);
    try {
        cmdQueue.enqueueReadBuffer(normalsMemory, true, 0, nTrianglesBuff[0] * 9 * 4, normalsBuff);
    } catch(ex) {
        throw "Couldn't read the buffer. " + ex;
    }
    
    maxThreshMemory.release();
    trianglesMemory.release();
    normalsMemory.release();
    nTrianglesMemory.release();
    marchingKernel.release();
    cmdQueue.flush();
    
    
    /*returnText = returnText + "\n\ntriangles: ";
    for(var i = 0; i < trianglesBuff.length; i+=1)
        returnText = returnText + trianglesBuff[i] + " ";
    
    returnText = returnText + "\n\nnormals: ";
    for(var i = 0; i < normalsBuff.length; i+=10000)
        returnText = returnText + normalsBuff[i] + " ";*/
    
    //console.log("nTirangles: " + nTrianglesBuff[0]);
    
    return new Array(nTrianglesBuff, trianglesBuff, normalsBuff, threshold);
}

function constructVBO(numOfTriangles, triangleArray, normalArray, threshold){
    nTrianglesBuff = numOfTriangles; // int buffer
    trianglesBuff = triangleArray; // float buffer
    //labelHelper = new TrianglesLabelHelper(nTrianglesBuff.get(0));
    
    
    var geometry = new THREE.BufferGeometry();

    var bufferVertices = new Float32Array(trianglesBuff.length);
    
    for(var i = 0; i < bufferVertices.length; i+=3){
        bufferVertices[i] = trianglesBuff[i];
        bufferVertices[i+1] = trianglesBuff[i+1];
        bufferVertices[i+2] = trianglesBuff[i+2];
    }
    
    geometry.addAttribute( 'position', new THREE.BufferAttribute( bufferVertices, 3 ) );
    
    var bufferNormlas = new Float32Array(normalArray.length);
    
    for(var i = 0; i < bufferVertices.length; i+=3){
        bufferNormlas[i] = normalArray[i];
        bufferNormlas[i+1] = normalArray[i+1];
        bufferNormlas[i+2] = normalArray[i+2];
    }
    
    geometry.addAttribute( 'normal', new THREE.BufferAttribute( bufferNormlas, 3 ) );
    
    
    /*for(var i = 0, j = 0; i < trianglesBuff.length; i+=9){
        geometry.vertices.push(
            new THREE.Vector3( trianglesBuff[i],  trianglesBuff[i+1], trianglesBuff[i+2] ),
            new THREE.Vector3( trianglesBuff[i+3], trianglesBuff[i+4], trianglesBuff[i+5] ),
            new THREE.Vector3(  trianglesBuff[i+6], trianglesBuff[i+7], trianglesBuff[i+8] )
        );
        geometry.faces.push( new THREE.Face3( j, j+1, j+2 ) );
        j+=3;
    }

    geometry.computeBoundingSphere();*/
    
    var rawVertices = geometry.attributes.position.array;
        rawVertexAvgX = 0,
        rawVertexAvgY = 0,
        rawVertexAvgZ = 0;
    
    for(var i = 0; i < rawVertices.length; i = i + 3){
        rawVertexAvgX = rawVertexAvgX + rawVertices[i];
        rawVertexAvgY = rawVertexAvgY + rawVertices[i+1];
        rawVertexAvgZ = rawVertexAvgZ + rawVertices[i+2];
    }
    rawVertexAvgX = Math.round(rawVertexAvgX / (rawVertices.length / 3) * 10) / 10;
    rawVertexAvgY = Math.round(rawVertexAvgY / (rawVertices.length / 3) * 10) / 10;
    rawVertexAvgZ = Math.round(rawVertexAvgZ / (rawVertices.length / 3) * 10) / 10;
    
    geometry.attributes.position.needsUpdate = true;
    for(var i = 0; i < rawVertices.length; i = i + 3){
        //console.log(vertices[i] + " " + vertices[i+1] + " " + vertices[i+2]);
        rawVertices[i] = rawVertices[i] - rawVertexAvgX;
        rawVertices[i+1] = rawVertices[i+1] - rawVertexAvgY;
        rawVertices[i+2] = rawVertices[i+2] - rawVertexAvgZ;
    }
    
    
    var material = new THREE.MeshBasicMaterial({
        color: 0xFF0000
    });
    
    var mesh = new THREE.Mesh(geometry, material);
    //mesh.material.color.setRGB(1,0,0);
    var threeObject = new THREE.Object3D();
    threeObject.add(mesh);
 
    threeObject.name = "rawObject";

    //editor.scene.add(threeObject);
    editor.addObject( threeObject );
    sceneObject = editor.scene.getObjectByName("rawObject");
    myCamera = editor.camera;
    //change initial rotation
    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 1, 0 ), Math.PI/180 * -87.5 );
    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 0, 1 ), Math.PI/180 * -45 );
    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 1, 0 ), Math.PI/180 * -45 );

    var light = new THREE.PointLight( 0xffffff, 1, 0 ); 
    // color, intensity, distance
    light.name = 'InitPointLight';

    light.position.set(editor.camera.position.x, editor.camera.position.y, editor.camera.position.z + 10);
    editor.addObject( light );
    editor.camera.lookAt(new THREE.Vector3(0,0,0));         
    cameraStartPosition = editor.camera.position.toArray();

    //define camera controls



    // x is red, y is green z is blue
    var axis = new THREE.AxisHelper(100);
    editor.scene.add(axis);
    
    
}


function enqueueKernel(kernel, dimensions, cmdQueue){
    var dim = dimensions.length;
    var globalWorkSize = new Array(dim);

    for (var i = 0; i < dim; i++) {
        globalWorkSize[i] = dimensions[i];
    }   

    try {
        cmdQueue.enqueueNDRangeKernel(kernel,dim, null, globalWorkSize);
        //cmdQueue.enqueueNDRangeKernel(kernel, dim, globalWorkSize, null, null, null, null);
    } catch(ex) {
        throw "Couldn't enqueue the kernel. " + ex;
    }
}
      
function getGauss1DKernel(sigma) { //returns float array

		var size = Math.floor(2 * Math.ceil(3 * sigma / mhdContent.dx) + 1); //int

		var privKernel = new Array(size); //float array
        var privKernelView = new Float32Array(privKernel);
    
		var sum = 0;
		for (var i = 0; i < size; i++) {
			var x = i - Math.floor(size / 2);
			privKernelView[i] =  ((1 / (Math.sqrt(2 * Math.PI) * sigma)) * Math.exp(-(x * x) / (2 * sigma * sigma)));
			sum += privKernelView[i];
		}
        
        
		for (var i = 0; i < size; i++) {
			privKernelView[i] /= sum;
		}

		return privKernelView;
}
