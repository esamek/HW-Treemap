
(function($){

    var getAmounts = function(obj){
        var a = [];
        for(allocation in obj){
            var amt = obj[allocation];
            if(amt > 0 && allocation != 'NetIncome'){
                a.push(amt);
            }

        }
        return a;
    };

    var getLabels = function(obj){
        var l = [];
        for(allocation in obj){
            var all = allocation;
            if(allocation != 'NetIncome'){
                l.push(allocation);
            }

        }
        return l;
    }

    var isArray = function(arr) {
            return arr && arr.constructor === Array;
    };







    var defaultData = {
        'NetIncome': 4558,
        'Savings'  : 300,
        'Debt'     : 0,
        'Bills'    : 1456,
        'RegExp'   : 1200,
        'Reserve'  : 250
    };


    function HWTreemap(el,data,options){
        this.init(el,data);
        return this;
    }

    var treemapMethods = {

        init: function(el,data){
            this.$chart = $(el);
            this.chart  = $(el).get(0);
            this._data_ = data;

            this.processData();
            this.calcTreemapNodes();
            this.draw();
        },
        processData: function(){
            var that = this,
                d = this._data_,
                d_ = [],
                net = d.NetIncome,
                totalAllocated = 0;

            for(name in d){
                if(name != 'NetIncome' && d[name] > 0){
                    var n = name.toString();
                    totalAllocated += d[name];
                    var area = {
                        'name':n,
                        'amt' :d[name],
                        'dist': d[name] / net
                    };
                    d_.push(area);
                }
            }
            var leftover = net - totalAllocated;
            d_.push({
                'name': 'LeftoverIncome',
                'amt' : leftover,
                'dist': leftover / net
            });

            this.data = d_;
        },
        getLabels: function(){
            var d = this.data,
                amts = [];
            $.each(d,function(i,v){
                amts.push(v.name);
            });
            return amts;
        },
        getAmounts: function(){
            var d = this.data,
                amts = [];
            $.each(d,function(i,v){
                amts.push(v.amt);
            });
            return amts;
        },
        getDist: function(){
            var d = this.data,
                amts = [];
            $.each(d,function(i,v){
                amts.push(v.dist);
            });
            return amts;
        },
        calcTreemapNodes: function(){

            var d = this.data,
                w = this.$chart.width(),
                h = this.$chart.height(),
                that = this;

            var dataArray = this.getDist(d);
            var net = this._data_.NetIncome;
            var totalAllocated = 0;

            $.each(dataArray, function(i,v){
                totalAllocated += v;
                var p = v / net;
                dataArray[i] = p;
            });

            var labelArray = this.getLabels(d);

            var nodes  = Treemap.generate(dataArray,w,h);
            var nodeArray = [];
            $.each(nodes,function(i,v){

                    nodeArray.push({
                        'name' : labelArray[i],
                        'nodes': nodes[i]
                    });

            });

            this.nodes = nodeArray;
            this.width  = w;
            this.height = h;
        },

        draw: function(){
            var that = this;


            this.paper = new Raphael(that.chart,that.width,that.height);

            var p = this.paper,
                n = this.nodes;
            //background
            this.background = p.rect(0,0,that.width,that.height);
            this.background.attr('fill','green');
            $.each(n,function(i,v){
                var name = v.name;
                var points = {
                    x1 : v.nodes[0],
                    y1 : v.nodes[1],
                    x2 : v.nodes[2] - v.nodes[0],
                    y2 : v.nodes[3] - v.nodes[1]
                };
                v.x1 = v.nodes[0];
                v.y1 = v.nodes[1];
                v.x2 = v.nodes[2];
                v.y2 = v.nodes[3];
                v.w = points.x2;
                v.h = points.y2;
                v.box = p.rect(points.x1,points.y1,points.x2,points.y2);
                var tx = v.x1 + (v.w / 2);
                var ty = v.y1 + (v.h / 2);
                v.label = p.text(tx, ty, name);
                v.label.attr('font-size',that.fontSize(v.w,v.h));

                if(v.label.getBBox().width > v.x2-v.x1 && v.label.getBBox().width <= v.y2-v.y1) {
                    v.label.rotate(-90);
                }
                v.cover = p.rect(points.x1,points.y1,points.x2,points.y2)
                            .attr('opacity',0)
                            .attr('fill','#fff')
                            .attr('stroke','#fff');

                that.doColors(v);
                that.doEventHandling(v);

            });





        },

        doEventHandling: function(node){
            var that = this,
                box = node.box,
                label = node.label,
                cover = node.cover,
                p = this.paper;
                node.open = false;

                box._kind = "box";
                label._kind = "label";
                cover._kind = "cover";

                node.set = p.set();
                node.set.push(
                    box,
                    label,
                    cover
                );



                this.clickHandler(node);
                this.hoverHandler(node);


        },
        hoverHandler: function(node){
            node.cover.hover(function(){
                if(node.open) return;
                node.box.animate({
                    'opacity':1,
                    'stroke-opacity':1
                },300,'>');
            },
            function(){
                if(node.open) return;
                node.box.animate({
                    'opacity':0.2,
                    'stroke-opacity':0
                },300,'<');
            });
        },
        clickHandler: function(node){
            var that = this;
            var tX = (node.x1 == 0) ?  0 : node.x1 * -1;
            var tY = (node.y1 == 0) ?  0 : node.y1 * -1;
            node.cover.click(function(){

                if(node.open == false){

                    node.set.forEach(function(a){
                        a.toFront().animate({
                             width:  that.width,
                             height: that.height,
                            transform: "t" + tX + "," + tY
                        },400,'backIn');

                        if(a._kind == "box"){
                            a.animate({
                                'stroke-opacity':1,
                                'opacity':1
                            },400,'>');
                        }


                    });

                    node.open = true;

                }else{

                    node.set.forEach(function(a){

                        a.stop();

                        a.animate({
                            transform: "",
                            width:  node.w,
                            height: node.h
                        },500,'bounce');


                        if(a._kind == "box"){
                            a.animate({
                                'stroke-opacity':0.2,
                                'opacity':0.2
                            },400,'>');
                        }

                    });

                    node.open = false;
                }

            });


        },

        doColors: function(b){
            var color;
            var colors = ['#F9C031',"#00b2e9","#f5871e","#de1c85","#575a5d","#76c34d","#76C34D"];

            switch(b.name){
                case "RegExp":
                    color = colors[2];
                break;
                case "Savings":
                    color = colors[1];
                break;
                case "Bills":
                    color = colors[0];
                break;
                case "Reserve":
                    color = colors[3];
                break;
                case "Debt":
                    color = colors[4]
                break;
                case "LeftoverIncome":
                    color = colors[5]
                break;
            }

            b.box.attr('fill',color)
                 .attr('opacity',0.2);
            b.box.attr('stroke','#fff')
                 .attr('stroke-width',3)
                 .attr('stroke-opacity',0);


        },


        averagelabelsize:function(){
            var that  = this;
            var labels = getLabels(that._data_);
            return that.totalLabelLength(labels) / that.countLabels(labels)
        } ,
        // total length of labels (i.e [["Italy"],["Spain", "Greece"]] -> 16)
        totalLabelLength: function(arr) {
            var i, total = 0;
            var that = this;
            if(isArray(arr[0])) {
                for(i=0; i<arr.length; i++) {
                    total += that.totalLabelLength(arr[i]);
                }
            } else {
                for (i = 0; i<arr.length; i++){
                   total += arr[i].length;
                }
            }
            return total;
        },

            // count of labels (i.e [["Italy"],["Spain", "Greece"]] -> 3)
        countLabels: function (arr) {
            var i, total = 0;
            var that = this;
            if(isArray(arr[0])) {
                for(i=0; i<arr.length; i++) {
                    total += that.countLabels(arr[i]);
                }
            } else {
                for (i = 0; i<arr.length; i++){
                   total += 1;
                }
            }
            return total;
        },

        fontSize: function (width, height) {
            // the font size should be proportional to the size of the box (and the value)
            // otherwise you can end up creating a visual distortion where two boxes of identical
            // size have different sized labels, and thus make it look as if the two boxes
            // represent diffferent sizes
            var that = this;
            var area = width*height;
            var arearoot = Math.pow(area, 0.5);
            return Math.min( arearoot / (that.averagelabelsize()), 20);
        }



    };


    $.extend(HWTreemap.prototype,treemapMethods);

    $.fn.HWTreemap = function(data,options){
        return new HWTreemap(this,data,options);
    };

})(jQuery);




var x;


$(function(){
var defaultData = {
        'NetIncome': 4558,
        'Savings'  : 300,
        'Debt'     : 0,
        'Bills'    : 1456,
        'RegExp'   : 1200,
        'Reserve'  : 250
    };


   x = $('#treemap').HWTreemap(defaultData);


        // // Mouse Over Effect Definition
        // function initMouseOver(b,l){
        //     //l.attr('opacity',0.5);
        //     console.log('mo');
        // }

        // // Mouse Out Effect Definition
        // function initMouseOut(b,l){

        // }






        // // interaction api
        // function initInteractions(b,l){
        //      b.hover(initMouseOver(b,l),initMouseOut(b,l));
        //     // b.mouseover = initMouseOver(b,l);
        //     // b.mouseout = initMouseOut(b,l);
        // }









        // var data = [60000, 60000, 40000, 30000, 20000, 10000];
        // var labels = ["Bills", "Savings", "Regular Expenses", "Reserve", "Debt Payments", "Leftover Income"];
        // var colors = ['#F9C031',"#00b2e9","#f5871e","#de1c85","#575a5d","#76c34d"];




});