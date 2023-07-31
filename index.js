const fs = require("fs");
const https = require("https");
const path = require("path");

// Replace with the remote base URL where your files are hosted
const remoteBaseUrl = "https://airecipeviews.luispatriciodev.repl.co/views";

// File structure definition
const fileStructure = {
  views: {
    pages: ["iFrameRedirect.ejs", "index.ejs", "process.ejs"],
    partials: ["footer.ejs", "head.ejs", "header.ejs"],
  },
};

function createFolderStructure(folderStructure, currentPath) {
  for (const folderName in folderStructure) {
    const folderPath = path.join(currentPath, folderName);
    fs.mkdirSync(folderPath, { recursive: true });
    if (Array.isArray(folderStructure[folderName])) {
      downloadFiles(folderPath, folderStructure[folderName]);
    } else {
      createFolderStructure(folderStructure[folderName], folderPath);
    }
  }
}

function downloadFiles(folderPath, files) {
  for (const file of files) {
    const fileUrl = `${remoteBaseUrl}/${folderPath.replace("./", "")}/${file}`;
    const filePath = path.join(folderPath, file);
    const fileStream = fs.createWriteStream(filePath);

    https.get(fileUrl, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fileStream);
      } else {
        console.error(`Failed to download file: ${fileUrl}`);
      }
    });
  }
}

// Start downloading
if (process.env["download"] == "true") {
  createFolderStructure(fileStructure, "./");
}

var axios = require("axios");
var express = require("express");
var app = express();

// Middleware to parse incoming request bodies
app.use(express.urlencoded({ extended: true }));

// set the view engine to ejs
app.set("view engine", "ejs");

// use res.render to load up an ejs view file

// index page
app.get("/", function (req, res) {
  if (req.query.setID) {
    res.render("pages/index");
  } else {
    res.render("pages/index", {
      id: req.query.preset,
    });
  }
});

// create recipe function
app.post("/createRecipe", function (req, res) {
  const createRecipeOptions = {
    method: "POST",
    url: "https://api.recipesai.co/createRecipe",
    headers: { "content-type": "application/json" },
    data: { food: req.body.food },
  };

  axios
    .request(createRecipeOptions)
    .then(function (response) {
      const recipeID = response.data.recipeID;
      // Call the completeRecipeOptions asynchronously using async/await
      completeRecipe(recipeID)
        .then(() => {
          res.redirect(`/waiting/${recipeID}`);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send("An error occurred while processing the recipe.");
        });
    })
    .catch(function (error) {
      console.error(error);
      res.status(500).send("An error occurred while creating the recipe.");
    });
});

// Function to call completeRecipeOptions asynchronously
async function completeRecipe(recipeID) {
  const completeRecipeOptions = {
    method: "POST",
    url: "https://api.recipesai.co/completeRecipe",
    headers: { "content-type": "application/json" },
    data: { id: recipeID },
  };

  await axios.request(completeRecipeOptions);
}

// waiting page
app.use("/waiting", function (req, res) {
  const options = {
    method: "GET",
    url: `https://backend.nex.sh/items/recipes${req.path}`,
    headers: { Authorization: "Bearer NHZnU4dOtSE4SXgNHonq1z1u-75jhI7c" },
  };

  axios
    .request(options)
    .then(function (response) {
      if (response.data.data.status == "draft") {
        res.render("pages/process", {
          processDetail: "Generating your recipe using AI...",
        });
      } else {
        res.render("pages/iFrameRedirect", {
          recipeID: req.path,
        });
      }
    })
    .catch(function (error) {
      console.error(error);
    });
});

app.listen(8080);
console.log("Server is listening on port 8080");
