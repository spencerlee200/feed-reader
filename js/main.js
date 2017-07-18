window.addEventListener('load', (e) => {
  e.preventDefault();
  var con = new Controller();
});

class Controller
{
  constructor()
  {
    this.model = new Model();
    this.view = new View();
    this.posts = [];
    this.favorites = [];
    if(localStorage.getItem("subreddit") == null) {
      localStorage.setItem("subreddit", "/r/oldschoolcool");
      $("#title").html("/r/oldschoolcool");
    }
    this.subreddit = localStorage.getItem("subreddit");
    $("#title").html(this.subreddit);
    $("#newSub").on("click", function() {
      var sub = $("#sub-input").val();
      localStorage.setItem("subreddit", sub);
      window.location.reload();
    });
    if((localStorage.getItem("favorites")) == null) {
      localStorage.setItem("favorites", JSON.stringify(this.favorites));
    }
    $("#counter").html((JSON.parse(localStorage.getItem("favorites")).length) || ("0"));
    this.model.getPosts(this.subreddit);
    this.view.displayAll(this.posts);

    //Functions for hover effects on like button
    $(document).on( 'mouseenter', '.post', function () {
      $(this).find(".like").effect( "slide", "right","slow" );
    });
    $(document).on( 'mouseleave', '.post', function () {
      $(this).find(".like").effect("drop", "slow");
    });

    //Functionality for like button
    $(document).on( 'click', '.like', function () {
       if($(this).hasClass("liked")) {
        $(this).effect( "shake","slow" );
         var removeFavorite = new Event('removeFavorite');
         removeFavorite.data = $(this).parent().attr('id');
         document.dispatchEvent(removeFavorite);
         $(this).removeClass('liked');
       }
       else {
         $(this).addClass('liked');
         var addFavorite = new Event('addFavorite');
         addFavorite.data = $(this).parent().attr('id');
         document.dispatchEvent(addFavorite);
       }
    });

    //Functionality for routes
    $(document).on( 'click', 'nav li', function () {
       if($(this).hasClass("selected")) {

       }
       else {
         $(this).siblings().removeClass('selected');
         $(this).addClass('selected');
         if($(this).attr('id') == "favorites") {
           var showFavorites = new Event('showFavorites');
           document.dispatchEvent(showFavorites);
         }
         else {
           var showFeed = new Event('showFeed');
           document.dispatchEvent(showFeed);
         }
       }
    });

    //Event to construct post objects before displaying them
    document.addEventListener('parseFeed', (e) =>
    {
      e.preventDefault();
      this.favorites = JSON.parse(localStorage.getItem("favorites"));
      if(e.data != null)
      {
        var posts = [];
        for (var i = 0; i < e.data.length; i++) {
          var newPost = new Object();
          newPost.id = e.data[i].data.id;
          newPost.title = e.data[i].data.title;
          if(e.data[i].data.url.includes("imgur")) {
            newPost.thumbnail = e.data[i].data.thumbnail;
          }
          else {
            newPost.thumbnail = e.data[i].data.url;
          }
          newPost.author = e.data[i].data.author;
          newPost.score = e.data[i].data.score;
          newPost.favorited = false;
          this.posts.push(newPost);
        }
        for(var a = 0; a < this.posts.length; a++) {
          for(var r = 0; r < this.favorites.length; r++) {
            if(this.posts[a].id == this.favorites[r].id){
              this.posts[a].favorited = true;
            }
          }
        }
        this.view.displayAll(this.posts);
      }
      else
      {
        alert("Sorry feed not found!");
      }
    }, false);

    document.addEventListener('showFavorites', (e) =>
    {
      e.preventDefault();
      this.view.displayFavorites();
    }, false);

    document.addEventListener('showFeed', (e) =>
    {
      e.preventDefault();
      this.view.displayAll(this.posts);
    }, false);

    document.addEventListener('addFavorite', (e) =>
    {
      e.preventDefault();
      for (var i = 0; i < this.posts.length; i++) {
        if(this.posts[i].id == e.data) {
          var newFave = this.posts[i];
          if(this.favorites.length != 0) {
            this.favorites.push(newFave);
            localStorage.setItem("favorites", JSON.stringify(this.favorites));
            $("#counter").html(this.favorites.length);
          }
          else {
            this.favorites.push(newFave);
            localStorage.setItem("favorites", JSON.stringify(this.favorites));
            $("#counter").html(this.favorites.length);
          }
        }
      }
    }, false);

    document.addEventListener('removeFavorite', (e) =>
    {
      e.preventDefault();
      for (var i = 0; i < this.favorites.length; i++) {
        if(this.favorites[i].id == e.data) {
          this.favorites.splice(i,1);
          localStorage.setItem("favorites", JSON.stringify(this.favorites));
        }
      }
      $("#counter").html(this.favorites.length);
      if($("#feed").hasClass("selected")) {
        this.view.displayAll(this.posts);
      }
      else {
        this.view.displayFavorites();
      }
    }, false);
  }
}

class Model
{
  constructor() { }

  getPosts(subreddit)
  {
    $.ajax({
        url: "https://www.reddit.com" + subreddit + "/top/.json?limit=25",
        type: 'GET',
        dataType: 'json',
        success: function(response) {
          if(response.error){
            console.log(response.error);
          } else {
            var parseFeed = new Event('parseFeed');
            parseFeed.data = response.data.children;
            document.dispatchEvent(parseFeed);
          }
        }
    });
  }
}

class View
{
  contructor()
  {
    console.log("View Created");
  }

  displayAll(arr)
  {
    var post = " ";
    for(var i = 0; i < arr.length; i++)
      {
        post += "<div id='" + arr[i].id + "'class='post'>";
        if(arr[i].favorited) {
          post += "<div class='like hidden liked'><i class='fa fa-heart' aria-hidden='true'></i></div>";
        }
        else {
          post += "<div class='like hidden'><i class='fa fa-heart' aria-hidden='true'></i></div>";
        }
        post += "<div class='img-container'><img src='" + arr[i].thumbnail + "' /></div>";
        post += "<h2> " + arr[i].title + "</h2>";
        post += "<p class='img-info'><i class='fa fa-user' aria-hidden='true'></i> /u/" + arr[i].author + " &#8226; <i class='fa fa-bolt' aria-hidden='true'></i> " + arr[i].score +"</p>";
        post += "</div>";
    }
    $("#posts").html(post);
  }

  displayFavorites(){
    var arr = JSON.parse(localStorage.getItem("favorites"));
    var fave = " ";
    if(arr == "") {
      fave += "<div id='banner'><p> No favorites yet.</p></div>";
    }
    else {
      for(var i = 0; i < arr.length; i++)
      {
          fave += "<div id='" + arr[i].id + "'class='post'>";
          fave += "<div class='like hidden liked trash'><i class='fa fa-trash' aria-hidden='true'></i></div>";
          fave += "<div class='img-container'><img src='" + arr[i].thumbnail + "' /></div>";
          fave += "<h2> " + arr[i].title + "</h2>";
          fave += "<p class='img-info'><i class='fa fa-user' aria-hidden='true'></i> /u/" + arr[i].author + " &#8226; <i class='fa fa-bolt' aria-hidden='true'></i> " + arr[i].score +"</p>";
          fave += "</div>";
      }
    }
    $("#posts").html(fave);
  }
}
