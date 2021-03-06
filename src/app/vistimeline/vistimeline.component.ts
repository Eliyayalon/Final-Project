import { AfterViewInit, Component, OnInit, ElementRef, ViewChild, Input } from '@angular/core';
import { Node } from '../models/models';
import { NodeService } from '../node.service';
import { debug } from 'util';
import { getDate } from 'ngx-bootstrap/chronos/utils/date-getters';
import { typeSourceSpan, ThrowStmt } from '@angular/compiler';
import { ExportToCsv } from 'export-to-csv';
declare var vis: any;
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ChangeEvent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import bsCustomFileInput from 'bs-custom-file-input'
import * as moment from 'moment';
@Component({
  selector: 'app-vistimeline',
  templateUrl: './vistimeline.component.html',
  styleUrls: ['./vistimeline.component.css']
})
export class VistimelineComponent implements OnInit {
  @Input() root: Node;



 

  public config = {
    placeholder: 'Type the content here!'
  }

public model = 
{
  editorData: '',    placeholder: 'Type the content here!'


};


public isDisabled = false;
   


  public Editor = ClassicEditor;
  @ViewChild("visjsTimeline") timelineContainer: ElementRef;
  tlContainer: any;
  timeline: any;
  data: any;
  options: {};
  values = '';
  allow=this.nodeService.allowToCreate;
  fatherItem: string[];
  selectedNode:Node=null;
  descriptionIsAllow:boolean=false;
  importStat:boolean=false;
  showItemDet:boolean=false;
   convertedDateStart;
   convertedDateEnd;
   description:String;
   disableButton:boolean=false;

  constructor(public nodeService: NodeService)
  {

  }

  ngOnInit() {
  

   }

  ngAfterViewInit() {
    
   
  }


///////////////////////////////////// On Import Complete ///////////////////////////////////////////////

  onImportComplete(newRoot: Node) 
  {
    this.root = newRoot;
    this.updateGraph();
  }

///////////////////////////////////// Toggle Disabled   ///////////////////////////////////////////////
  
  toggleDisabled() 
  {
    this.isDisabled = !this.isDisabled
  }

///////////////////////////////////// Enable Description  ///////////////////////////////////////////////


enableDescription()
{
  if( this.descriptionIsAllow==false)
  {
    this.descriptionIsAllow=true;

  }
  else
  {
    this.descriptionIsAllow=false;

  }
}

///////////////////////////////////// Import Choose  ///////////////////////////////////////////////


importChoose()
{  
  this.importStat=true;

}
///////////////////////////////////// Update Graph  ///////////////////////////////////////////////


  updateGraph() 
  {
    
    this.nodeService.allowToCreate=false;
    this.allow=this.nodeService.allowToCreate;
    this.getTimelineData();
    this.tlContainer = this.timelineContainer.nativeElement;
    this.timeline = new vis.Timeline(this.tlContainer, this.data, this.options);
    this.timeline.itemsData.remove(1);

    this.timeline.on('select', (properties) => {
      this.descriptionIsAllow=false;
      this.showItemDet=false;
      var id = properties.items[0];
      this.selectedNode=this.nodeService.findNode(id,this.root);
      this.model.editorData=this.selectedNode.description;
      this.description=this.selectedNode.description;
    })
 
  }


///////////////////////////////////// Change Name  ///////////////////////////////////////////////

      
changeName()
{
  var currentItem = prompt('Enter Item Name Please:');
  var id=this.timeline.getSelection();
  const tree=this.nodeService.findNode(id[0],this.root);
  tree.content=currentItem;

}

///////////////////////////////////// Update Parents Timeline  ///////////////////////////////////////////////

  updateParentsTimeline(parent: Node){
    if (parent!= null && !parent.isRoot){
      const itemData = {...this.timeline.itemSet.items[parent.id],start:parent.start,end:parent.end}; //,oldStart:newStart,oldEnd:newEnd};
      this.timeline.itemsData.update(itemData);
      this.updateParentsTimeline(parent.parent);
    }
  }

///////////////////////////////////// Update Children Timeline  ///////////////////////////////////////////////


  updateChildrenTimeline(node: Node){
    if (node!=null && !node.isRoot){
      const itemData = {...this.timeline.itemSet.items[node.id],start:node.start,end:node.end}; //,oldStart:newStart,oldEnd:newEnd};
      this.timeline.itemsData.update(itemData);
      for (var i=0; i<node.children.length; i++){
        this.updateChildrenTimeline(node.children[i]);
      }
    }
  }

  ///////////////////////////////////// On Change    ///////////////////////////////////////////////


 public onChange( { editor }: ChangeEvent ) 
 {
    const rich = editor.getData();
    this.selectedNode.description=rich;
    console.log(rich);
}



  ///////////////////////////////////// Disable Enable Tree  ///////////////////////////////////////////////

  disableEnableTree(node:Node,enabled:boolean)
  {
    if (node!=null && !node.isRoot){
      node.isEnabled=enabled;
      const itemData = {...this.timeline.itemSet.items[node.id],className: enabled?'enabled':'disabled'}; //,oldStart:newStart,oldEnd:newEnd};
      this.timeline.itemsData.update(itemData);
      for (var i=0; i<node.children.length; i++){
        this.disableEnableTree(node.children[i], enabled);
      }
        
          this.updateTreePrice(node.parent);

        
    }

  }

///////////////////////////////////// Remove Tree  ///////////////////////////////////////////////


  removeTree(tree: Node)
  {
    this.timeline.itemsData.remove(this.timeline.itemSet.items[tree.id]);
    for (var i=0; i<tree.children.length;i++)
    {
      this.removeTree(tree.children[i]);
    }
  }

///////////////////////////////////// On Key  ///////////////////////////////////////////////


  onKey(event:Event)
   { // with type info
    this.values = (<HTMLInputElement>event.target).value;
  }

  returnItemDate(event:any)
  {
  }


///////////////////////////////////// Find Content  ///////////////////////////////////////////////

findContent()
  {
      const node=this.nodeService.findNodeContent(this.values,this.root);
      if(node!=null)
      {
        this.timeline.setSelection(node.id, {focus:true});
      }
  }

///////////////////////////////////// Disable Enable Activity ///////////////////////////////////////////////

  
  disableEnableActivity()
  {
    if(this.selectedNode.isEnabled==true)
    {
    var id=this.timeline.getSelection();
    const tree=this.nodeService.findNode(id[0],this.root);
    this.disableEnableTree(tree,false);
    }
    else if(this.selectedNode.isEnabled==false)
    {
      var id=this.timeline.getSelection();
      const tree=this.nodeService.findNode(id[0],this.root);
      this.disableEnableTree(tree,true);

    }
  }

///////////////////////////////////// Update Tree Price ///////////////////////////////////////////////


  updateTreePrice(node: Node)
  {
    var price=0;
    
    if (node == null )
    {
      
      return;
    }
    
    for(var i=0;i<node.children.length;i++)
    {
      if(node.children[i].isEnabled)
      {
        price+=node.children[i].price;
      }
    }

    node.price=price;
    
    if (node.isRoot)
    {
      return;
    }

    this.updateTreePrice(node.parent);
    

  }

  ///////////////////////////////////// Set Price ///////////////////////////////////////////////

  setPrice()
  {
    var priceOfItem = parseFloat(prompt("Enter a Value", "0"));
    var id=this.timeline.getSelection();
    const tree=this.nodeService.findNode(id[0],this.root);
    tree.price=priceOfItem;
    this.updateTreePrice(tree.parent);
  }


  showItemDetails()
  {
    if( this.showItemDet==false)
    {
      this.showItemDet=true;
      this.convertedDateStart = moment( this.selectedNode.start).format('DD/MM/YYYY, HH:mm');;
      this.convertedDateEnd = moment( this.selectedNode.end).format('DD/MM/YYYY, HH:mm');;
  

    }
    else
    {
      this.showItemDet=false;

    }
  
  }

///////////////////////////////////// Get TimeLine Data ///////////////////////////////////////////////

  getTimelineData() 
  {
    if (this.root) 
    {
      this.root.isRoot=true;
      const toBeVisited: Node[] = [];
      this.root.children.forEach(x => toBeVisited.push(x));
      const graphItems = [];

      while (toBeVisited.length) 
      {
        const current = toBeVisited.pop();
        toBeVisited.push(...current.children);
        console.log("current is enablerd: "+ current.isEnabled);
        if (!current.isRoot)
        {
          graphItems.push({ 
          id: current.id, 
          content: current.content, 
          start: current.start, 
          end: current.end,
          className:current.isEnabled?"enabled":"disabled"});
          }
      }
      this.data = new vis.DataSet(graphItems);
      

    } 
    
    
    else 
    
    {
      this.root = new Node(null,null,'root',null,true,true,0,"");
      this.root.id='root';
      this.root.start=null;
      this.root.end=null;
      this.root.content=null;
      this.root.isRoot=true;
      this.root.children=[];
      this.root.parent=null;


      var today = new Date();
      var nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate()+7);
      this.data = new vis.DataSet([
       { id: 1, content: 'item1', className: 'disabled', start: today,  end: nextWeek}
      ]);
    }


///////////////////////////////////// Options ///////////////////////////////////////////////

    this.options = {
      moveable: true,
      height: '400px',
      editable: true,
      showTooltips: true,
      clickToUse: true,
      //multiselect:true,
      align:'center',


///////////////////////////////////// Template ///////////////////////////////////////////////

      template: (item, element, data) => {

        if (item != null){
        
          const node = this.nodeService.findNode(item.id, this.root);
          if  (node != null){
            return  node.content ;
          }
        }
        
      },

      ///////////////////////////////////// On Add ///////////////////////////////////////////////

      onAdd: (newItem, callback) => {
       
        newItem.className = "enabled";
        let currNode=new Node(newItem.start,newItem.end,newItem.id,newItem.content,false,true,0,"");
        currNode.children=[];
        currNode.parent=this.nodeService.getParent(currNode, this.root);
        currNode.parent.children.push(currNode);
        this.nodeService.updateParent(currNode.parent, currNode.start, currNode.end);
        newItem.children = [];
        newItem.start=currNode.start;
        newItem.content=currNode.content;
        newItem.parent=currNode.parent;
        newItem.end=currNode.end;
        this.updateParentsTimeline(newItem.parent);
        callback(newItem);
},

///////////////////////////////////// On Update ///////////////////////////////////////////////

      onUpdate:  (item, callback)=> { //change name of item
        item.content = prompt('Enter Item Name Please:', item.content);
        
        if (item.content != null) 
        {
          const node = this.nodeService.findNode(item.id, this.root);
          node.content = item.content;
          callback(item);
        }
        
        else 
        {
          callback(null);
        }
      },

///////////////////////////////////// On Remove ///////////////////////////////////////////////

      onRemove:  (item, callback) =>{ 
        
        const node = this.nodeService.findNode(item.id, this.root);
        this.removeTree(node);
        for( var i = 0; i < node.parent.children.length; i++)
        { 
            if ( node.parent.children[i].id === item.id)
             {
              node.parent.children.splice(i, 1); 
              break;
            }
        }

      this.updateTreePrice(node.parent);


      },

      onMoving:  (item, callback) =>{ //change name of item
       
        const node = this.nodeService.findNode(item.id, this.root);
        if (node != null)
        {
          var oldStart = node.start;
          var oldEnd = node.end;
          node.start = item.start;
          node.end = item.end;
          this.nodeService.updateParent(node.parent, node.start, node.end);
          this.updateParentsTimeline(node.parent);
          this.nodeService.updateChildren(node, node.start, node.end, oldStart, oldEnd);
          this.updateChildrenTimeline(node);
        }
        
        callback(item);
      },


      tooltip: {
        followMouse: true,
        overflowMethod: 'cap'
      },


      margin: {
        item: 20,
        axis: 20
      }
    };

  }

}




