

var mvMatrix = mat4.create();
var rotx = 0;
mat4.identity(mvMatrix);

var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}





function WebGL(CID, FSID, VSID) {
	var canvas = document.getElementById(CID);
    if(!canvas.getContext("webgl") && !canvas.getContext("experimental-webgl")) {
        alert("Your Browser Doesn't Support WebGL");
    } else {
        this.GL = (canvas.getContext("webgl")) ? canvas.getContext("webgl") : canvas.getContext("experimental-webgl");  

		this.GL.clearColor(1.0, 1.0, 1.0, 1.0);
		this.GL.enable(this.GL.DEPTH_TEST); //enable depth testing
		this.GL.depthFunc(this.GL.LEQUAL); //sets perspective view

		this.AspectRatio = canvas.width / canvas.height;

		// set Perspective Matrix
		mat4.perspective(45, this.AspectRatio, 0.1, 100.0, pMatrix);


		// load shaders here 
		var FShader = document.getElementById(FSID);
		var VShader = document.getElementById(VSID);

		if (!FShader || !VShader) {
			alert("could not find shaders");
		}
		else {
			var Code = LoadShader(FShader);
			FShader = this.GL.createShader(this.GL.FRAGMENT_SHADER);
			this.GL.shaderSource(FShader, Code);
			this.GL.compileShader(FShader);

			Code = LoadShader(VShader);
			VShader = this.GL.createShader(this.GL.VERTEX_SHADER);
			this.GL.shaderSource(VShader, Code);
			this.GL.compileShader(VShader);

			//create shader program

			this.ShaderProgram = this.GL.createProgram();
			this.GL.attachShader(this.ShaderProgram, FShader);
			this.GL.attachShader(this.ShaderProgram, VShader);
			this.GL.linkProgram(this.ShaderProgram);
			this.GL.useProgram(this.ShaderProgram);

			// link vetex pos attr from shader
            this.VertexPosition = this.GL.getAttribLocation(this.ShaderProgram, "VertexPosition");
            this.GL.enableVertexAttribArray(this.VertexPosition);

            this.VertexNormal = this.GL.getAttribLocation(this.ShaderProgram, "VertexNormal");
            this.GL.enableVertexAttribArray(this.VertexNormal);


            this.VertexTexture = this.GL.getAttribLocation(this.ShaderProgram, "TextureCoord");
            this.GL.enableVertexAttribArray(this.VertexTexture);


		}
	}

    this.Draw = function(Object, Texture) {
            var VertexBuffer = this.GL.createBuffer(); //Create a New Buffer
            
            //Bind it as The Current Buffer
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, VertexBuffer); 
            
            // Fill it With the Data 
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Object.vertices), this.GL.STATIC_DRAW); 
            
            //Connect Buffer To Shader's attribute
            this.GL.vertexAttribPointer(this.VertexPosition, 3, this.GL.FLOAT, false, 0, 0); 
            
            
            //Repeat For The next Two
            var TextureBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, TextureBuffer);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Object.textures), this.GL.STATIC_DRAW);
            this.GL.vertexAttribPointer(this.VertexTexture, 2, this.GL.FLOAT, false, 0, 0);
            

            var VertexNormalBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, VertexNormalBuffer);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Object.vertexNormals), this.GL.STATIC_DRAW);
            this.GL.vertexAttribPointer(this.VertexNormal, 3, this.GL.FLOAT, false, 0, 0);


            var TriangleBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, TriangleBuffer);
            this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(Object.indices), this.GL.STATIC_DRAW);
            
            
            //Set slot 0 as the active Texture
            this.GL.activeTexture(this.GL.TEXTURE0);
            
            //Load in the Texture To Memory
            this.GL.bindTexture(this.GL.TEXTURE_2D, Texture);
            
            //Update The Texture Sampler in the fragment shader to use slot 0
            this.GL.uniform1i(this.GL.getUniformLocation(this.ShaderProgram, "uSampler"), 0);
            
            //Set The Perspective and Transformation Matrices
            var perMatrix = this.GL.getUniformLocation(this.ShaderProgram, "PerspectiveMatrix");  
            this.GL.uniformMatrix4fv(perMatrix, false, new Float32Array(pMatrix));
            
            var normalMatrix = mat3.create();
            mat4.toInverseMat3(Object.objMatrix, normalMatrix);
            mat3.transpose(normalMatrix);


            var norMatrix = this.GL.getUniformLocation(this.ShaderProgram, "NormalMatrix");  
            this.GL.uniformMatrix3fv(norMatrix, false, new Float32Array(normalMatrix));



            var transMatrix = this.GL.getUniformLocation(this.ShaderProgram, "TransformationMatrix");  
            this.GL.uniformMatrix4fv(transMatrix, false, new Float32Array(Object.objMatrix));  
            
            //Draw The Triangles
            this.GL.drawElements(this.GL.TRIANGLES, Object.indices.length, this.GL.UNSIGNED_SHORT, 0);

    }

    this.LoadTexture = function (img) {
        //create a new Texure and Assign it as the active one
        var TempTex = this.GL.createTexture();
        this.GL.bindTexture(this.GL.TEXTURE_2D, TempTex);

        //flip positive Y 
        this.GL.pixelStorei(this.GL.UNPACK_FLIP_Y_WEBGL, true);

        //load image
        this.GL.texImage2D(                  
                            this.GL.TEXTURE_2D,             // target
                            0,                              // level of detail 0-basline
                            this.GL.RGBA,                   // internal format
                            this.GL.RGBA,                   // Bitmap bitmap
                            this.GL.UNSIGNED_BYTE, 
                            img
                            );

        this.GL.texParameteri(this.GL.TEXTURE_2D, this.GL.TEXTURE_MAG_FILTER, this.GL.LINEAR);  
        this.GL.texParameteri(this.GL.TEXTURE_2D, this.GL.TEXTURE_MIN_FILTER, this.GL.LINEAR_MIPMAP_NEAREST);  
        this.GL.generateMipmap(this.GL.TEXTURE_2D); 
         
        //Unbind the texture and return it.
        this.GL.bindTexture(this.GL.TEXTURE_2D, null);
        return TempTex;
    }


}

function LoadShader(Script) {
	var Code = "";
	var CurrentChild = Script.firstChild;
	while (CurrentChild) {
		if (CurrentChild.nodeType == CurrentChild.TEXT_NODE) {
			Code += CurrentChild.textContent;
		}
		CurrentChild = CurrentChild.nextSibling;
	}
	return Code;
}



var GL; 
     
//Our finished texture
var Texture;
     
//This will hold the textures image 
var TextureImage;
var suzzaneDataOBJ;
var meshes = {}; 


function tick() {
    requestAnimFrame(tick);
    animate();
    GL.Draw(meshes.suzzane, Texture);
}

var lastTime = 0;
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
    }
    lastTime = timeNow;
}

var mouse = new Mouse();

window.onload = function(){
    var canvas = document.getElementById("GLCanvas");
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    
    window.onmousedown = function () {
        mouse.handleMouseDown();
    }
    window.onmouseup = function () {
        mouse.handleMouseUp();
    }
    // anoymous function to get this to work!
    window.onmousemove = function () {
        mouse.handleMouseMove();
    };
    

    OBJ.downloadMeshes({
        'suzzane': 'suzzane.obj',
    }, Ready, meshes);

    function Ready(){
        GL = new WebGL("GLCanvas", "FragmentShader", "VertexShader");
        TextureImage = new Image();

        TextureImage.onload = function(){
            Texture = GL.LoadTexture(TextureImage);
            meshes.suzzane.objMatrix = mat4.identity(mat4.create());
            mat4.translate(pMatrix,  [0.0, 0.0, -5.0]);
            GL.Draw(meshes.suzzane, Texture);
            tick();

        };
        TextureImage.src = "images/ao.png";
    }
}

function Mouse() {
    this.lastMouseX = null;    
    this.lastMouseY = null;
    this.mouseDown = false;
    
    this.handleMouseDown = function () {
        this.mouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }
    this.handleMouseUp = function () {
        this.mouseDown = false;
    }

    this.handleMouseMove = function () {

        if (!this.mouseDown) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - this.lastMouseX
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

        var deltaY = newY - this.lastMouseY;
        mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

        mat4.multiply(newRotationMatrix, meshes.suzzane.objMatrix, meshes.suzzane.objMatrix);

        this.lastMouseX = newX
        this.lastMouseY = newY;

    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

