(function(factory, root) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    exports.SHRI = factory();
  } else {
    root.SHRI = factory();
  }
})(function SHRI() {
  'use strict';

  var students = [],
      mentors = [],
      teams = [],
      tasks = [];

  var TASK_TYPE = {
    PERSONAL: 'personal',
    TEAM: 'team',
    UNKNOWN: 'unknown'
  };

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function isStudent(obj) {
    return obj instanceof Student;
  }

  function isMentor(obj) {
    return obj instanceof Mentor;
  }

  function isTeam(obj) {
    return obj instanceof Team;
  }

  function isTask(obj) {
    return obj instanceof Task;
  }

  function getStudents() {
    return students;
  }

  function getMentors() {
      return mentors;
  }

  function getTeams() {
    return teams;
  }

  function getTasks() {
    return tasks;
  }

  function Student(name, team) {
    if (!name || typeof name !== 'string') {
      throw new Error('Expected name to be a string');
    }
    if (team && !isTeam()) {
      throw new Error('Expected team to be a Team instance');
    }
    this.name = name;
    this.team = team ? team : null;
    this.tasks = [];
    this.wishList = [];
    students.push(this);
  }

  Student.prototype.getTeam = function() {
    return this.team;
  };
  
  Student.prototype.hasTeam = function() {
    return !!this.team;
  };

  Student.prototype.addTask = function(task) {
    if (!isTask(task)) {
      throw new Error('Expected task to be a Task instance');
    }
    if (task.hasOwner()) {
      throw new Error('This task already has owner')
    }
    this.tasks.push(task);
    task.owner = this;
    return this;
  };

  Student.prototype.getOwnTasks = function() {
    return this.tasks;
  };

  Student.prototype.getTeamTasks = function() {
    if (!this.hasTeam()) {
      throw new Error('Not a team member');
    }
    return this.getTeam().getTasks();
  };

  Student.prototype.getAllTasks = function() {
    return this.hasTeam() ? this.getOwnTasks().concat(this.getTeamTasks()) : this.getOwnTasks();
  };

  Student.prototype.getCompletedTasks = function() {
    return this.getAllTasks().filter(function(task) {
      return task.done;
    });
  };

  // TODO: 1) уже есть команда
  Student.prototype.joinTeam = function(team) {
    if (!isTeam(team)) {
      throw new Error('Expected team to be a Team instance');
    }
    team.getStudents().push(this);
    this.team = team;
    return this;
  };


  function Mentor(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Expected name to be a string');
    }
    this.name = name;
    this.wishList = [];
    this.students = [];
    mentors.push(this);
  }


  function Team(name, students) {
    if (!name || typeof name !== 'string') {
      throw new Error('Expected name to be a string');
    }
    this.name = name;
    this.students = [];
    this.tasks = [];
    teams.push(this);

    if (students) {
      if (!isArray(students)) {
        throw new Error('Expected students to be an array of Student');
      } else {
        students.forEach(function(student) {
          if (!isStudent(student)) {
            throw new Error('Expected students to be an array of Student');
          }
          this.addStudent(student);
        });
      }
    }
  }

  Team.prototype.getStudents = function() {
    return this.students;
  };

  // TODO: 2) Уже есть команда
  Team.prototype.addStudent = function(student) {
    this.students.push(student);
    student.team = this;
    return this;
  };

  Team.prototype.getTasks = function() {
    return this.tasks;
  };

  Team.prototype.addTask = function(task) {
    if (!isTask(task)) {
      throw new Error('Expected task to be a Task instance');
    }
    if (task.hasOwner()) {
      throw new Error('This task already has owner')
    }
    this.tasks.push(task);
    task.owner = this;
    return this;
  };


  function Task(title) {
    if (!title || typeof title !== 'string') {
      throw new Error('Expected title to be a string');
    }
    this.title = title;
    this.done = false;
    this.owner = null;
    this.mark = null;
    tasks.push(this);
  }

  Task.prototype.getType = function() {
    var owner = this.getOwner();
    if (isStudent(owner)) {
      return TASK_TYPE.PERSONAL;
    } else if (isTeam(owner)) {
      return TASK_TYPE.TEAM;
    } else {
      return TASK_TYPE.UNKNOWN;
    }
  };

  Task.prototype.getOwner = function() {
    return this.owner;
  };

  Task.prototype.hasOwner = function() {
    return !!this.owner;
  };

  Task.prototype.setMark = function(mark) {
    if (!mark || typeof mark !== 'number' || mark < 0 || mark > 5) {
      throw new Error('Expected mark to be a number from 0 to 5');
    }
    if (this.mark) {
      throw new Error('This task has already been marked');
    }
    this.mark = mark;
    this.done = true;
    return this;
  };

  function round(number, digits) {
    digits = digits || 3;
    var multiplier = Math.pow(10, digits);
    return Math.round(number * multiplier) / multiplier;
  }

  function getPointsByIndex(length, index) {
    if (index === -1) {
      return 0;
    }
    return round((length - index) / length);
  }

  function spreadStudents() {
    var students = getStudents();
    var mentors = getMentors();

    students.forEach(function(student) {
      var suitedMentor;
      var maxPoints = 0;
      var maxStudentPoints = 0;
      mentors.forEach(function(mentor) {
        var mentorPoints = getPointsByIndex(student.wishList.length, student.wishList.indexOf(mentor));
        var studentPoints = getPointsByIndex(mentor.wishList.length, mentor.wishList.indexOf(student));
        if (!mentorPoints || !studentPoints) {
          return;
        }
        var totalPoints = round((mentorPoints + studentPoints) / 2, 6);
        if (totalPoints > maxPoints) {
          maxPoints = totalPoints;
          suitedMentor = mentor;
        } else if (totalPoints === maxPoints && studentPoints > maxStudentPoints) {
          maxStudentPoints = studentPoints;
          suitedMentor = mentor;
        }
      });
      if (suitedMentor) {
        suitedMentor.students.push([student, maxPoints]);
      }
    });
  }
  
  return {
    Student: Student,
    Mentor: Mentor,
    Team: Team,
    Task: Task,
    spreadStudents: spreadStudents
  }
}, this);
