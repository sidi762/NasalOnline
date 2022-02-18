const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  //res.end('<h1>Hello, World!</h1>')


  // standard node module
  var execFile = require('child_process').execFile

  // this launches the executable and returns immediately
  var info = execFile("nasal-interpreter/nasal", ["-v"],
    function (error, stdout, stderr) {
      // This callback is invoked once the child terminates
      // You'd want to check err/stderr as well!
      res.write(stdout);
      res.write("------------------------------------\n");
    });

  // this launches the executable and returns immediately
  var child = execFile("nasal-interpreter/nasal", ["-t", "-d", "nasal-interpreter/test/ascii-art.nas"],
    function (error, stdout, stderr) {
      // This callback is invoked once the child terminates
      // You'd want to check err/stderr as well!
      console.log("Output and error(s): ");
      console.log(stdout);
      console.log(error);
      console.log(stderr);
      res.write(stdout);
      res.write("\n");
      res.write("error(s): " + error);
      res.end("stderr: " + stderr);
    });

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
