// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");

var pointsPerPlayer = [1, 2, 4, 6, 8, 10, 12];

if (Meteor.isClient) {
  var nextIndex = function () {
    var player = Players.findOne({ voting: true });
    if (!player)
      return;

    for (var i = 0; i < player.voted.length; i++)
      if (!player.voted[i].player)
        return i;
  };

  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.current_points = function () {
    var player = Players.findOne({ voting: true }),
      index = nextIndex();
    return index >= 0 ? player.voted[index].points : 0;
  };

  Template.leaderboard.points_left = function () {
    var player = Players.findOne({ voting: true }),
      points = [];

    for (var i = 0; i < player.voted.length; i++) {
      if (!player.voted[i].player) {
        points.push(player.voted[i].points);
      }
    }
    console.log(points);
    return points;
  };

  Template.leaderboard.voting_player_name = function () {
    var player = Players.findOne({ voting: true });
    return player && player.name;
  };

  Template.leaderboard.voting_player_number = function () {
    var player = Players.findOne({ voting: true });
    return player && player.number;
  };

  Template.leaderboard.has_points = function () {
    var player = Players.findOne({ voting: true }),
      index = nextIndex();
    return player && index >= 0;
  };

  Template.player.selected = function () {
    var player = Players.findOne({ voting: true });
    return player && player._id == this._id ? "selected" : "";
  };

  Template.player.points_given = function () {
    var player = Players.findOne({ voting: true });
    if (!player)
      return;

    for (var i = 0; i < player.voted.length; i++)
      if (player.voted[i].player == this._id)
        return player.voted[i].points
  };

  Template.leaderboard.events({
    'click .done': function () {
      var player = Players.findOne({ voting: true });
      Players.update(player._id, {
        $set: { voting: false }
      });
    }
  });

  Template.player.events({
    'click': function () {
      var player = Players.findOne({ voting: true });

      // Deselect if selected is pressed.
      if (player && player._id == this._id) {
        Players.update(player._id, {
          $set: { voting: false }
        });
        return;
      }

      // Select player that is going to start voting.
      if (!player) {
        player = this;

        // Recover if all votes have been removed.
        if (player.voted.length === 0) {
          var points = [];
          for (var i = 0; i < pointsPerPlayer.length; i++) {
            points.push({
              player: null,
              points: pointsPerPlayer[i]
            });
          }
          player.voted = points;
          Players.update(player._id, {
            $set: { voted: points }
          });
        }

        player.voting = true;
        Players.update(player._id, {
          $set: { voting: player.voting }
        });
        return;
      }

      for (var x = 0; x < player.voted.length; x++) {
        var vote = player.voted[x];

        // Remove points if pressed again.
        if (vote.player == this._id) {
          vote.player = null;
          Players.update(player._id, {
            $set: { voted: player.voted }
          });
          Players.update(this._id, {
            $inc: { score: -vote.points }
          });
          return;
        }

        // Is vote not taken?
        if (!vote.player) {
          vote.player = this._id;
          Players.update(player._id, {
            $set: { voted: player.voted }
          }),
          Players.update(this._id, {
            $inc: { score: vote.points }
          });
          return;
        }
      }
    }
  });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Players.find().count() === 0) {
      var player,
        names = ["Iceland",
                   "England",
                   "Ireland",
                   "Denmark",
                   "Sweden",
                   "Norway",
                   "Finland",
                   "France",
                   "Germany",
                   "Spain",
                   "Russia",
                   "Italy",
                   "Netherlands",
                   "Azerbaijan",
                   "Greece",
                   "Malta"];

      for (var i = 0; i < names.length; i++) {
        player = {
          name: names[i],
          title: 'The best song ' + (i + 1),
          number: i + 1,
          score: 0,
          voted: []
        };
        for (var x = 0; x < pointsPerPlayer.length; x++) {
          player.voted.push({
            player: null,
            points: pointsPerPlayer[x]
          });
        }
        Players.insert(player);
      }
    }
  });
}
