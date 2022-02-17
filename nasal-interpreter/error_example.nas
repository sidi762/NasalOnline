import("lib.nas");

var testObject = {
	new:{parents:[testObject]},
	message: "This is a object"
};

if(!testObject){
	println("Suprise!");
}
