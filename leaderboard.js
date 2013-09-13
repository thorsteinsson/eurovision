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
        return i
  };

  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.current_points = function () {
    var player = Players.findOne({ voting: true }),
      index = nextIndex();
    return index >= 0 ? player.voted[b].points : 0
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

    for (var i = 0; i < player.voted.length; b++)
      if (player.voted[i].player == this._id)
        return player.voted[i].points
  };

  Template.leaderboard.events({
    'click .done': function () {
      Players.update({ voting: true }, { $set: { voting: false }});
    }
  });

  Template.player.events({
    'click': function () {
      var player = Players.findOne({ voting: true });
      if (player == this._id)
        return;

      if (!player) {
        player = this;
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
        // deselect if pressed again
        if (player.voted[x].player == this._id) {
          player.voted[x].player = null;
          Players.update(player._id, { $set: { voted: player.voted }});
          Players.update(this._id, {
            $inc: { score: -player.voted[x].points }
          });
          return;
        }

        if (!player.voted[x].player) {
          player.voted[x].player == this._id;
          Players.update(player._id, {
            $set: { voted: player.voted }
          }),
          Players.update(this._id, {
            $inc: { score: player.voted[x].points}
          });
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
        names = ["Ada Lovelace",
                   "Grace Hopper",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];

      for (var i = 0; i < names.length; i++) {
        player = {
          name: names[i],
          title: 'Lag ' + i,
          number: i,
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