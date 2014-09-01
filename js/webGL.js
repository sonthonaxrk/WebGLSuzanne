

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
            this.VertexPosition = this.GL.getAttribLocation(this.ShaderProgram, "aVertexPosition");
            this.GL.enableVertexAttribArray(this.VertexPosition);

            this.VertexNormal = this.GL.getAttribLocation(this.ShaderProgram, "aVertexNormal");
            this.GL.enableVertexAttribArray(this.VertexNormal);

            this.VertexTexture = this.GL.getAttribLocation(this.ShaderProgram, "aTextureCoord");
            this.GL.enableVertexAttribArray(this.VertexTexture);

		}
	}

    this.initBuffer = function(Object) {
            Object.buffers = {};
            Object.buffers.vertexBuffer = this.GL.createBuffer();        
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Object.buffers.vertexBuffer); 
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Object.vertices), this.GL.STATIC_DRAW); 
            
            Object.buffers.vertexNormalBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Object.buffers.vertexNormalBuffer);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Object.vertexNormals), this.GL.STATIC_DRAW);
            
            Object.buffers.tangentBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Object.buffers.tangentBuffer);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Object.tangents), this.GL.STATIC_DRAW);

            Object.buffers.bitangentBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Object.buffers.bitangentBuffer);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Object.bitangents), this.GL.STATIC_DRAW);


            Object.buffers.textureBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Object.buffers.textureBuffer);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Object.textures), this.GL.STATIC_DRAW);
            

            Object.buffers.triangleBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, Object.buffers.triangleBuffer);
            this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(Object.indices), this.GL.STATIC_DRAW);  
    }


    this.Draw = function (Object) {
            this.setObjectMatrixUniorms(Object);
            this.GL.activeTexture(this.GL.TEXTURE0);
            this.GL.bindTexture(this.GL.TEXTURE_2D, Object.Texture);
            
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Object.buffers.vertexBuffer); 
            this.GL.vertexAttribPointer(this.VertexPosition, 3, this.GL.FLOAT, false, 0, 0); 

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Object.buffers.vertexNormalBuffer); 
            this.GL.vertexAttribPointer(this.VertexNormal, 3, this.GL.FLOAT, false, 0, 0);

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Object.buffers.textureBuffer);
            this.GL.vertexAttribPointer(this.VertexTexture, 2, this.GL.FLOAT, false, 0, 0);

            this.GL.drawElements(this.GL.TRIANGLES, Object.indices.length, this.GL.UNSIGNED_SHORT, 0);
    }


    this.setObjectMatrixUniorms = function (Object) {

        this.GL.uniform1i(this.GL.getUniformLocation(this.ShaderProgram, "uSampler"), 0);
        var perMatrix = this.GL.getUniformLocation(this.ShaderProgram, "uViewMatrix");  
        this.GL.uniformMatrix4fv(perMatrix, false, new Float32Array(pMatrix));       
                
        var normalMatrix = mat3.create();
        mat4.toInverseMat3(Object.objMatrix, normalMatrix);
        mat3.transpose(normalMatrix);

        var norMatrix = this.GL.getUniformLocation(this.ShaderProgram, "uNormalMatrix");  
        this.GL.uniformMatrix3fv(norMatrix, false, new Float32Array(normalMatrix));

        var transMatrix = this.GL.getUniformLocation(this.ShaderProgram, "uModelMatrix");  
        this.GL.uniformMatrix4fv(transMatrix, false, new Float32Array(Object.objMatrix));  
    } 

    this.setEnviromentUniforms = function () {
        var uAmbientColor = this.GL.getUniformLocation(this.ShaderProgram, "uAmbientColor");  
        var uPointLightingLocation = this.GL.getUniformLocation(this.ShaderProgram, "uPointLightingLocation");  
        var uPointLightingColor = this.GL.getUniformLocation(this.ShaderProgram, "uPointLightingColor");  

        this.GL.uniform3f(uAmbientColor, 0.5, 0.5, 0.5);
        this.GL.uniform3f(uPointLightingLocation, 2, 2, 2);
        this.GL.uniform3f(uPointLightingColor, 1, 1, 1);

    }

    this.LoadTexture = function (img) {
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



     
var meshes = {}; 


function tick() {
    requestAnimFrame(tick);
    animate();
    GL.Draw(meshes.suzzane);
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
    

    OBJ.downloadMeshes({
        'suzzane': 'suzzane.obj',
    }, Ready, meshes);

    function Ready(){
        GL = new WebGL("GLCanvas", "FragmentShader", "VertexShader");
        TextureImage = new Image();

        TextureImage.onload = function(){

            meshes.suzzane.Texture = GL.LoadTexture(TextureImage);
            meshes.suzzane.objMatrix = [0.7624991536140442, 0.23857446014881134, -0.601394534111023, 0, -0.3268221318721771, 0.9442471861839294, -0.039787907153367996, 0, 0.5583732724189758, 0.22688810527324677, 0.7979588508605957, 0, 0, 0, 0, 1];
            mat4.translate(pMatrix,  [0.0, 0.0, -5.0]);

            GL.setEnviromentUniforms();
            GL.initBuffer(meshes.suzzane);
            GL.Draw(meshes.suzzane);
            tick();

        };


        TextureImage.src = "images/ao.png";
    }



    var canvas = document.getElementById("GLCanvas");
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    
    window.onmousedown = function () {
        mouse.handleMouseDown();
    }
    window.onmouseup = function () {
        mouse.handleMouseUp();
    }
    window.onmousemove = function () {
        mouse.handleMouseMove();
    };

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

