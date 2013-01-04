
(function($){



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
                labels = [];
            $.each(d,function(i,v){
                labels.push(v.name);
            });
            return labels;
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
            this.background.attr('fill','#575a5d');
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
                v.highlightColor = that.getColor(v);
                v.box.attr('fill',v.highlightColor)
                     .attr('fill-opacity',0)
                     .attr('stroke','#fff')
                     .attr('stroke-width',3);

                var tx = v.x1 + (v.w / 2);
                var ty = v.y1 + (v.h / 2);
                v.label = p.text(tx, ty, name);
                v.label.attr('font-size',that.fontSize(v.w,v.h))
                       .attr('fill','#fff')
                       .attr('font-family',"'Proxima Nova', sans-serif")

                if(v.label.getBBox().width > v.x2-v.x1 && v.label.getBBox().width <= v.y2-v.y1) {
                    v.label.rotate(-90);
                }
                v.cover = p.rect(points.x1,points.y1,points.x2,points.y2)
                            .attr('opacity',0)
                            .attr('fill','#fff')
                            .attr('stroke','#fff')
                            .attr('cursor','pointer');



                that.doEventHandling(v);

            });





        },

        doEventHandling: function(node){
            var that      = this,
                box       = node.box,
                label     = node.label,
                cover     = node.cover,
                p         = this.paper;
                node.open = false;

                box._kind   = "box";
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
                    'fill-opacity':1
                },300,'>');
            },
            function(){
                if(node.open) return;
                node.box.animate({
                    'fill-opacity':0
                },300,'<');
            });
        },
        showBoxContent: function(node){
            var that = this,
                p    = this.paper;







        },
        hideBoxContent: function(node){

        },
        clickHandler: function(node){
            var that = this;

            node.cover.click(function(){
                // open logic
                if(node.open == false){

                    node.set.forEach(function(a){

                        if(a._kind == "box" || a._kind == "cover"){

                            var boxX = (node.x1 == 0) ?  0 : node.x1 * -1;
                            var boxY = (node.y1 == 0) ?  0 : node.y1 * -1;

                            a.animate({
                                 width:  that.width,
                                 height: that.height,
                                transform: "t" + boxX + "," + boxY
                            },400,'backIn');

                        }else if(a._kind == "box"){

                            a.animate({
                                'stroke-opacity':1,
                                'fill-opacity':1
                            },400,'>');

                        }else if (a._kind == "label"){

                            var labelX = (a.attr('x') - 20) * -1;
                            var labelY = (a.attr('y') - 20) * -1;
                            console.log(labelX,labelY);
                            a.attr({'text-anchor': 'start'});
                            a.animate({
                                'transform'  : "R0,T" + labelX + "," + labelY,
                                'font-size'  : '24px'
                            },400,'>');

                        }

                        a.toFront();


                    });
                    that.showBoxContent(node);
                    node.open = true;
                // close logic
                }else{

                    node.set.forEach(function(a){

                        a.stop();
                        if(a._kind == "box" || a._kind == "cover"){
                            a.animate({
                                transform: "",
                                width:  node.w,
                                height: node.h
                            },500,'<');


                        }else if(a._kind == "box"){

                            a.animate({
                                'fill-opacity':0
                            },500,'>');

                        }else if (a._kind == "label"){
                            a.animate({
                                transform: "",
                                'font-size': that.fontSize(a.w,a.h)
                            },500,'bounce');
                            a.attr({'text-anchor': 'middle'});
                        }

                    });
                    that.hideBoxContent(node);
                    node.open = false;
                }

            });


        },

        getColor: function(b){
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


            return color;


        },


        averagelabelsize:function(){
            var that  = this;
            var labels = this.getLabels(that.data);
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
        'Debt'     : 100,
        'Bills'    : 956,
        'RegExp'   : 1200,
        'Reserve'  : 250
    };


   x = $('#treemap').HWTreemap(defaultData);




});