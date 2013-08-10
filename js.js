(function (undefined) {

    var findId = function (id) {
  	return document.getElementById(id);
	};
	
function Maze(param){
  var points = []; //массив с точками
  
  var Ctx = param.ctx.getContext('2d');  //где рисуем
  var width = param.ctx.width;  //габариты
  var height = param.ctx.height;
  var radius = param.radius;  //радиус точки
  var step = param.step;  //шаг смещения
  var vacuum = param.vacuum;  //свободное место
     
	//конструктор точек лабиринта
    function Dot(point){
    var x = point.x||width/2; //Х
    var y = point.y||height/2; //У
    var radius = point.radius||4; //радиус окружности для рисования
    var color = point.color||'#EF2B36'; //цвет красный
	var ctx = Ctx;
	
	this.draw = function(){
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();
    };
	
	this.draw();  //так как я проверяю наличие точки по цвету - вешь архинужная :)

  }

  this.build = function(){ 
   var expansionPoints =[];  //точки роста
   
   //задает начальные точки роста
   var generate = function(num){
     var point ={};
	 expansionPoints.push(new ExpansionPoint(point));  //в центр
	 /*
	 point.x = vacuum + step;
	 point.y = step -1;
	 point.vector = 4;
	 expansionPoints.push(new ExpansionPoint(point));
	 
	 
	 /*
	 for (var i=0; i<num; i++){
	 
	   point.x = Math.floor( Math.random() * width);
	   point.y = Math.floor( Math.random() * height);
	   expansionPoints.push(new ExpansionPoint(point));
	   
	   point.x = width - 40;
	   point.y = height - 40;
	   expansionPoints.push(new ExpansionPoint(point));
	   
	 }*/
   };
   
   
   
   generate(1);
   	while(expansionPoints.length > 0){
	  expansionPoints.forEach(calcNext);  //вычисление следующей точки, без проверки, добавление веток
	  var tmp = expansionPoints.filter(tstNext);  //отсеивает точки исчерпавшие число попыток выйти из тупика (попутно их считает)
	  expansionPoints = tmp;  //чистка
	  tmp = null;
	  expansionPoints.forEach(pointToMaze);  //добавка в лабиринт
	  
	  if (points.length > 300) expansionPoints.length = 0; // тяжко однако
	  findId("status").innerHTML = points.length; //число точек, итого
	  
	}
   
  function ExpansionPoint(point){
    this.x = point.x||width / 2;
	this.y = point.y||height / 2;
	var pace = 0;
    var newX = this.x;
    var newY = this.y;
    var vector = point.vector||0;
	var change = point.change||0;
	var canal = vacuum;
	var canva = Ctx;
	
	//отладочка
	/*
	this.getParam = function(){
	 var tmpObj = {};
	 tmpObj.x = this.x;
	 tmpObj.y = this.y;
	 tmpObj.newX = newX;
	 tmpObj.newY = newY;
	 tmpObj.pace = pace;
	 tmpObj.vector = vector;
	 tmpObj.change = change;
	 return tmpObj;
	}
	*/
	//////////////
	
	//когда можно двигаться на новую точку
	this.setNewPoint = function(){
	  this.x = newX;
	  this.y = newY;
	}
	
	//при забредании в тупик вернуть расчетные точки 
	this.setOldPoint = function() {
	  newX = this.x;
	  newY = this.y;
	}
	
	//считает newX, newY, меняет vector, создает новую точку 
	this.calcNewPos = function(){
	  var vectors = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];  //коэффиценты для движения в нужном направлении
	  
	  //меняем курс или случайно или +num
	  function changeVector(num){
	    if (!num){
		  var rnd = Math.floor(Math.random() * 100);
		  
		  if (rnd < 30) {
		    if (rnd%2) vector +=2;
			else vector -=2;
		  } else if (rnd <70) {
		    if (rnd % 2) vector++;
			else vector--;
		  }
		} else vector += num;
		// нормализация вектора
		if (vector>7) vector -= 8;
		if (vector<0) vector += 8;
      }  //changeVector(num)
	  
	  //ветвление
	  function createNewBranch(x, y){
	    var point ={};
		point.x = x;
		point.y = y;
		point.change = 1;  //сразу начинает искать свое направление
		expansionPoints.push(new ExpansionPoint(point));
	  }
	  
	  //перед расчетом нового положения возможно надо свернуть
	  if (change > 10){return;  //тупик, сам помрет потом
	  } else if (change >0) {
		changeVector(1);  //крутим вектор (всегда по часовой - косяк?)		
	  } else {
	    if (pace % 7) changeVector();  //пора менять курс (случайным образом)
		//if (pace % 19) createNewBranch(this.x, this.y);  //новая ветка (добавляется точка роста с этими координатами и change = 1)
	  }
	  //отладочка
	  //findId("dbg").innerHTML = "<p>this.x/y = " + this.x + "/" + this.y + "<br> step: " + step + " ; vector: " + vector + "</p>";
	  ///////
	  
	  //при любом раскладе, теперь пытаемся жить с этим вектором
	  newX = this.x + step * vectors[vector][0];
	  newY = this.y + step * vectors[vector][1];
	}  //this.calcNewPos
	
	//проверяет this.calcNewPos, отсеивает тупиковые, изменяет pace и change
	this.tstPoint = function(){
	  if (change > 10) return false; //это тупик, число попыток исчерпано - отсев
	  
	  var controlAngle = [[3.491, 5.951],[4.277, 6.737],[5.062, 7.522],[5.847, 8.307],[0.350, 2.810],[1.135, 3.595],[1.92, 4.38],[2.706, 5.166]];  //углы проверки направлений
      var start = controlAngle[vector][0];
      var finish = controlAngle[vector][1];
      var tx, ty;
	  var col = 0; //времянка для суммы RGBA всех точек
	  
	  //получение суммы RGB составляющих для точки
	  function sumColor(x, y, ctx){
	    var sum = 0;
	    for (i=0; i<3; i++){
		  sum += ctx.getImageData(x, y, 1, 1).data[i];
		}
		return sum;
	  }
	  
	  
	  for (var j=start; j<finish; j += 0.175){ //шаг 10 градусов
          tx = newX + Math.round(canal * Math.cos(j));  //дальние точки проверки
          ty = newY + Math.round(canal * Math.sin(j));
		  if ((tx > width - canal + step) || (ty > height - canal + step) || (tx < step + step-2) || (ty < step + step-2)) col += 1;  //край карты
          
		  col += sumColor(tx, ty, canva); 
                                 
		  tx = newX + Math.round((step + 1) * Math.cos(j));  //ближние точки проверки
          ty = newY + Math.round((step + 1) * Math.sin(j));
		  
		  col += sumColor(tx, ty, canva);
                        
	  }
	  
	  if (col > 0) { //в этом направлени двигаться нельзя
		  this.setOldPoint();  //возврат к исходной точке
          change++;  // счетчик попыток +1
		} else {  //чисто
          change = 0;  //сброс числа попыток
          pace++; //добавка шага		
		}
	  
	  return true;
	  
	}  //this.tstPoint
	
  }  //ExpansionPoint
	
  function calcNext(item){
    item.calcNewPos();
  }  //calcNext(item)
	
  	function tstNext(item){
	  return item.tstPoint();
	}  //tstNext(item)
	
  function pointToMaze(item){
     item.setNewPoint();
  
	  var point = {};
	  point.x = item.x;
	  point.y = item.y;
	  points.push(new Dot(point));
	 /* 
	  var tt =item.getParam();
	  alert( "x; y: " + tt.newX + "; " + tt.newY + "\n" + "pace "+tt.pace + "; vector " + tt.vector + "; change " + tt.change);
	 // points[points.lenght].draw();
	 /*
	 tmpObj.x = this.x;
	 tmpObj.y = this.y;
	 tmpObj.newX = newX;
	 tmpObj.newY = newY;
	 tmpObj.pace = pace;
	 tmpObj.vector = vector;
	 tmpObj.change = change;
	  */
	}  //pointToMaze(item)
	
	
   }  //this.build
   
   this.draw = function(){
     points.forEach(draw);
	 function draw(item){
	  // item.draw();
	   }
   }  //this.draw
   
   

}  //Maze  
    
var mazeParam ={
	//************************************//
    // глобальные (для генератора) переменные
	ctx: findId('myCanvas'),  //канва
	radius: 3,  //радиус окружности точки
	step: 5, //шаг смещения точки роста
	vacuum: 20 //свободное расстояние
	//************************************//	
}

var maze = new Maze(mazeParam);
maze.build();
//maze.draw();

})();
	
