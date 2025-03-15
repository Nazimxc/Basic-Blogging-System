const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const methodOverride = require("method-override");
const fs = require("fs");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Flash messages setup
const session = require("express-session");
const flash = require("express-flash");

app.use(session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
}));

app.use(flash());

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Load posts from JSON file
const postsFile = path.join(__dirname, "posts.json");
let posts = [];

if (fs.existsSync(postsFile)) {
    posts = JSON.parse(fs.readFileSync(postsFile, "utf-8"));
}

// Function to save posts to JSON
const savePosts = () => {
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2), "utf-8");
};

// Routes
app.get("/posts", (req, res) => {
    res.render("index.ejs", { posts, messages: req.flash() });
});

app.get("/posts/new", (req, res) => {
    res.render("new.ejs");
});

app.post("/posts", (req, res) => {
    const { username, content } = req.body;
    const id = uuidv4();
    posts.push({ id, username, content });
    savePosts();
    req.flash("success", "Post added successfully!");
    res.redirect("/posts");
});

app.get("/posts/:id", (req, res) => {
    const { id } = req.params;
    const post = posts.find((p) => id === p.id);
    if (!post) {
        req.flash("error", "Post not found!");
        return res.redirect("/posts");
    }
    res.render("show.ejs", { post });
});

app.get("/posts/:id/edit", (req, res) => {
    const { id } = req.params;
    const post = posts.find((p) => id === p.id);
    if (!post) {
        req.flash("error", "Post not found!");
        return res.redirect("/posts");
    }
    res.render("edit.ejs", { post });
});

app.patch("/posts/:id", (req, res) => {
    const { id } = req.params;
    const newContent = req.body.content;
    const post = posts.find((p) => id === p.id);
    
    if (!post) {
        req.flash("error", "Post not found!");
        return res.redirect("/posts");
    }

    post.content = newContent;
    savePosts();
    req.flash("success", "Post updated successfully!");
    res.redirect("/posts");
});

app.delete("/posts/:id", (req, res) => {
    const { id } = req.params;
    const newPosts = posts.filter((p) => id !== p.id);
    
    if (newPosts.length === posts.length) {
        req.flash("error", "Post not found!");
        return res.redirect("/posts");
    }

    posts = newPosts;
    savePosts();
    req.flash("success", "Post deleted successfully!");
    res.redirect("/posts");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
