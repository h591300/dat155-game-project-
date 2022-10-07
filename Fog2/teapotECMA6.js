class teapot {
  constructor() {
    this.numDivisions = 3;

    this.index = 0;

    this.points = [];
    this.normals = [];

    this.modelViewMatrix = [];
    this.projectionMatrix = [];

    this.axis = 0;
    this.xAxis = 0;
    this.yAxis = 1;
    this.zAxis = 2;
    this.theta = [0, 0, 0];
    this.dTheta = 5.0;

    this.flag = true;
    this.z = 0;
    this.zInc = 0.2;


    // Color of Fog
    this.fogColor = new Float32Array([0.745098, 0.745098, 0.745098]);
    // Distance of fog [where fog starts, where fog completely covers object]
    this.fogDist = new Float32Array([55, 180]);
    // Position of eye point (world coordinates)
    this.eye = new Float32Array([25,65,35, 1.0]);
    this.fogIncrement = 0.5;
    this.u_MvpMatrix;

    this.u_Eye;

  }

    bezier(u) {
      var b =new Array(4);
      var a = 1-u;
      b[3] = a*a*a;
      b[2] = 3*a*a*u;
      b[1] = 3*a*u*u;
      b[0] = u*u*u;
      return b;
    }

    nbezier(u) {
      var b = [];
      b.push(3*u*u);
      b.push(3*u*(2-3*u));
      b.push(3*(1-4*u+3*u*u));
      b.push(-3*(1-u)*(1-u));
      return b;
    }

    init() {

        this.canvas = document.getElementById("gl-canvas");

        this.gl = WebGLUtils.setupWebGL(this.canvas);
        if (!this.gl) {
            alert("WebGL isn't available");
        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this.gl.enable(this.gl.DEPTH_TEST);


        this.program = initShaders(this.gl, "vertex-shader", "fragment-shader");
        this.gl.useProgram(this.program);

        this.u_Eye = this.gl.getUniformLocation(this.program, 'u_Eye');
        this.u_FogColor = this.gl.getUniformLocation(this.program, 'u_FogColor');
        this.u_FogDist = this.gl.getUniformLocation(this.program, 'u_FogDist');
        this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_modelMatrix');
        // Pass fog color, distances, and eye point to uniform variable
        this.gl.uniform3fv(this.u_FogColor, this.fogColor); // Colors
        this.gl.uniform2fv(this.u_FogDist, this.fogDist);   // Starting point and end point
        this.gl.uniform4fv(this.u_Eye, this.eye);           // Eye point


        var sum = [0, 0, 0];
        for (var i = 0; i < 306; i++) for (j = 0; j < 3; j++)
            sum[j] += vertices[i][j];
        for (j = 0; j < 3; j++) sum[j] /= 306;
        for (var i = 0; i < 306; i++) for (j = 0; j < 2; j++)
            vertices[i][j] -= sum[j] / 2
        for (var i = 0; i < 306; i++) for (j = 0; j < 3; j++)
            vertices[i][j] *= 2;


        var h = 1.0 / this.numDivisions;

        var patch = new Array(numTeapotPatches);
        for (var i = 0; i < numTeapotPatches; i++) patch[i] = new Array(16);
        for (var i = 0; i < numTeapotPatches; i++)
            for (j = 0; j < 16; j++) {
                patch[i][j] = vec4([vertices[indices[i][j]][0],
                    vertices[indices[i][j]][2],
                    vertices[indices[i][j]][1], 1.0]);
            }


        for (var n = 0; n < numTeapotPatches; n++) {


            var data = new Array(this.numDivisions + 1);
            for (var j = 0; j <= this.numDivisions; j++) data[j] = new Array(this.numDivisions + 1);
            for (var i = 0; i <= this.numDivisions; i++) for (var j = 0; j <= this.numDivisions; j++) {
                data[i][j] = vec4(0, 0, 0, 1);
                var u = i * h;
                var v = j * h;
                var t = new Array(4);
                for (var ii = 0; ii < 4; ii++) t[ii] = new Array(4);
                for (var ii = 0; ii < 4; ii++) for (var jj = 0; jj < 4; jj++)
                    t[ii][jj] = this.bezier(u)[ii] * this.bezier(v)[jj];


                for (var ii = 0; ii < 4; ii++) for (var jj = 0; jj < 4; jj++) {
                    temp = vec4(patch[n][4 * ii + jj]);
                    temp = scale(t[ii][jj], temp);
                    data[i][j] = add(data[i][j], temp);
                }
            }

            var ndata = new Array(this.numDivisions + 1);
            for (var j = 0; j <= this.numDivisions; j++) ndata[j] = new Array(this.numDivisions + 1);
            var tdata = new Array(this.numDivisions + 1);
            for (var j = 0; j <= this.numDivisions; j++) tdata[j] = new Array(this.numDivisions + 1);
            var sdata = new Array(this.numDivisions + 1);
            for (var j = 0; j <= this.numDivisions; j++) sdata[j] = new Array(this.numDivisions + 1);
            for (var i = 0; i <= this.numDivisions; i++) for (var j = 0; j <= this.numDivisions; j++) {
                ndata[i][j] = vec4(0, 0, 0, 0);
                sdata[i][j] = vec4(0, 0, 0, 0);
                tdata[i][j] = vec4(0, 0, 0, 0);
                var u = i * h;
                var v = j * h;
                var tt = new Array(4);
                for (var ii = 0; ii < 4; ii++) tt[ii] = new Array(4);
                var ss = new Array(4);
                for (var ii = 0; ii < 4; ii++) ss[ii] = new Array(4);

                for (var ii = 0; ii < 4; ii++) for (var jj = 0; jj < 4; jj++) {
                    tt[ii][jj] = this.nbezier(u)[ii] * this.bezier(v)[jj];
                    ss[ii][jj] = this.bezier(u)[ii] * this.nbezier(v)[jj];
                }

                for (var ii = 0; ii < 4; ii++) for (var jj = 0; jj < 4; jj++) {
                    var temp = vec4(patch[n][4 * ii + jj]);
                    ;
                    temp = scale(tt[ii][jj], temp);
                    tdata[i][j] = add(tdata[i][j], temp);

                    var stemp = vec4(patch[n][4 * ii + jj]);
                    ;
                    stemp = scale(ss[ii][jj], stemp);
                    sdata[i][j] = add(sdata[i][j], stemp);

                }
                temp = cross(tdata[i][j], sdata[i][j])

                ndata[i][j] = normalize(vec4(temp[0], temp[1], temp[2], 0));
            }

            document.getElementById("ButtonX").onclick = function () {
                tp.axis = tp.xAxis;
                };
            document.getElementById("ButtonY").onclick = function () {
                tp.axis = tp.yAxis;

            };
            document.getElementById("ButtonZ").onclick = function () {
                tp.axis = tp.zAxis;

            };
            document.getElementById("ButtonT").onclick = function () {
                tp.flag = !tp.flag;
            };

            for (var i = 0; i < this.numDivisions; i++) for (var j = 0; j < this.numDivisions; j++) {
                this.points.push(data[i][j]);
                this.normals.push(ndata[i][j]);

                this.points.push(data[i + 1][j]);
                this.normals.push(ndata[i + 1][j]);

                this.points.push(data[i + 1][j + 1]);
                this.normals.push(ndata[i + 1][j + 1]);

                this.points.push(data[i][j]);
                this.normals.push(ndata[i][j]);

                this.points.push(data[i + 1][j + 1]);
                this.normals.push(ndata[i + 1][j + 1]);

                this.points.push(data[i][j + 1]);
                this.normals.push(ndata[i][j + 1]);
                this.index += 6;
            }
        }

        var vBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.points), this.gl.STATIC_DRAW);


        var vPosition = this.gl.getAttribLocation(this.program, "vPosition");
        this.gl.vertexAttribPointer(vPosition, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPosition);


        var nBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, nBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.normals), this.gl.STATIC_DRAW);

        var vNormal = this.gl.getAttribLocation(this.program, "vNormal");
        this.gl.vertexAttribPointer(vNormal, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vNormal);

        this.projectionMatrix = ortho(-4, 4, -4, 4, -200, 200);
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, "projectionMatrix"), false, flatten(this.projectionMatrix));
        this.normalMatrixLoc = this.gl.getUniformLocation(this.program, "normalMatrix");


        var lightPosition = vec4(0.0, 0.0, 20.0, 0.0);
        var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
        var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
        var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

        var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
        var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
        var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
        var materialShininess = 10.0;

        var ambientProduct = mult(lightAmbient, materialAmbient);
        var diffuseProduct = mult(lightDiffuse, materialDiffuse);
        var specularProduct = mult(lightSpecular, materialSpecular);

        this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "ambientProduct"), flatten(ambientProduct));
        this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "diffuseProduct"), flatten(diffuseProduct));
        this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "specularProduct"), flatten(specularProduct));
        this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "lightPosition"), flatten(lightPosition));
        this.gl.uniform1f(this.gl.getUniformLocation(this.program, "shininess"), materialShininess);
        this.gl.clearColor(this.fogColor[0], this.fogColor[1], this.fogColor[2], 1.0);
        this.render();
    }

    render() {
    this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if(this.flag) {
      this.theta[this.axis] += 0.5;

      if(this.z > 150|| this.z<0) this.zInc = this.zInc * -1.0;
      this.z += this.zInc;
      console.log(this.z);
    }
    this.modelViewMatrix = mat4();
    this.modelViewMatrix = mult(this.modelViewMatrix, translate(0,0,this.z));
    this.modelViewMatrix = mult(this.modelViewMatrix, rotate(this.theta[this.xAxis], [1, 0, 0]));
    this.modelViewMatrix = mult(this.modelViewMatrix, rotate(this.theta[this.yAxis], [0, 1, 0]));
    this.modelViewMatrix = mult(this.modelViewMatrix, rotate(this.theta[this.zAxis], [0, 0, 1]));



    var mvpMatrix = perspective(30, this.canvas.width/this.canvas.height, 1, 100);
    mvpMatrix = lookAt(vec3(this.eye[0], this.eye[1], this.eye[2]), vec3(0, 2, 0), vec3(0, 1, 0));
    mvpMatrix = mult(mvpMatrix, this.modelViewMatrix);

    this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, flatten(mvpMatrix));
    this.gl.uniformMatrix4fv( this.gl.getUniformLocation(this.program, "modelViewMatrix"), false, flatten(this.modelViewMatrix) );
    normalMatrix = [
        vec3(this.modelViewMatrix[0][0], this.modelViewMatrix[0][1], this.modelViewMatrix[0][2]),
        vec3(this.modelViewMatrix[1][0], this.modelViewMatrix[1][1], this.modelViewMatrix[1][2]),
        vec3(this.modelViewMatrix[2][0], this.modelViewMatrix[2][1], this.modelViewMatrix[2][2])
    ];


    this.fogDist[1] = this.fogDist[1] + this.fogIncrement;

        if(this.fogDist[1] <= 180.0 || this.fogDist[1] >=350.0)
            this.fogIncrement = this.fogIncrement*-1.0;

    this.gl.uniform2fv(this.u_FogDist, this.fogDist);
    this.gl.uniformMatrix3fv(this.normalMatrixLoc, false, flatten(normalMatrix) );

    this.gl.drawArrays( this.gl.TRIANGLES, 0, this.index);
    //requestAnimFrame(this.render);
    }
}//end class

let tp = new teapot();

onload = function() {
  tp.init();
  rndr();
}

function rndr() {
  tp.render();
  requestAnimFrame(rndr);
}
