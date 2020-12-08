-- figures.lua
-- Copyright (C) 2020 by RStudio, PBC

-- filter which tags subfigures with their parent identifier and also 
-- converts linked image figures into figure divs. we do this in a separate 
-- pass b/c normal filters go depth first so we can't actually
-- "see" our parent figure during filtering.
function preprocessFigures(explicitOnly)

  return {
    Pandoc = function(doc)
      local walkFigures
      walkFigures = function(parentId)
        
        local requires = {
          label = explicitOnly,
          caption = explicitOnly
        }
        if parentId ~= nil then
          requires.caption = false
        end
        
        return {
          Div = function(el)
           
            if isFigureDiv(el, requires) then
            
              if parentId ~= nil then
                el.attr.attributes["figure-parent"] = parentId
              else
                el = pandoc.walk_block(el, walkFigures(el.attr.identifier))
              end
              
              -- provide default caption if need be
              if figureDivCaption(el) == nil then
                el.content:insert(pandoc.Para({}))
              end
            end
            return el
          end,

          Para = function(el)
            return preprocessParaFigure(el, parentId, requires)
          end
        }
      end

      -- set up requires
      local requires = {
        label = explicitOnly,
        caption = explicitOnly
      }

      -- walk all blocks in the document
      for i,el in pairs(doc.blocks) do
        local parentId = nil
        if isFigureDiv(el, requires) then
          parentId = el.attr.identifier
          -- provide default caption if need be
          if figureDivCaption(el) == nil then
            el.content:insert(pandoc.Para({}))
          end
        end
        if el.t == "Para" then
          doc.blocks[i] = preprocessParaFigure(el, nil, requires)
        else
          doc.blocks[i] = pandoc.walk_block(el, walkFigures(parentId))
        end
      end
      
      return doc

    end
  }
end

function preprocessParaFigure(el, parentId, requires)
  
  -- if this is a figure paragraph, tag the image inside with any
  -- parent id we have and insert a "fake" caption
  local image = figureFromPara(el, requires)
  if image and isFigureImage(image, requires) then
    image.attr.attributes["figure-parent"] = parentId
    if #image.caption == 0 then
      image.caption:insert(pandoc.Str(""))
    end
    return el
  end
  
  -- if this is a linked figure paragraph, transform to figure-div
  -- and then transfer attributes to the figure-div as appropriate
  local linkedFig = linkedFigureFromPara(el, requires)
  if linkedFig and isFigureImage(linkedFig, requires) then
    
    -- create figure div
    return createFigureDiv(el, linkedFig, parentId)
    
  end
  
  -- always reflect back input if we didn't hit one of our cases
  return el
  
end

function createFigureDiv(el, linkedFig, parentId)
  -- create figure-div and transfer caption
  local figureDiv = pandoc.Div(pandoc.Para(el.content))
  local caption = linkedFig.caption:clone()
  figureDiv.content:insert(pandoc.Para(caption))
  linkedFig.caption = {}
  
  -- if we have a parent, then transfer all attributes (as it's a subfigure)
  if parentId ~= nil then
    figureDiv.attr = linkedFig.attr:clone()
    -- keep width and height on image for correct layout in docx
    if isDocxOutput() then
      linkedFig.attr = pandoc.Attr("", {}, {
        width = figureDiv.attr.attributes["width"],
        height = figureDiv.attr.attributes["height"],
      })
    else
      linkedFig.attr = pandoc.Attr()
    end
    figureDiv.attr.attributes["figure-parent"] = parentId
    
  -- otherwise just transfer id and any fig- prefixed attribs
  else
    -- transfer identifier
    figureDiv.attr.identifier = linkedFig.attr.identifier
    linkedFig.attr.identifier = ""
    
    -- transfer fig- attributes
    for k,v in pairs(linkedFig.attr.attributes) do
      if string.find(k, "^fig%-") then
        figureDiv.attr.attributes[k] = v
        linkedFig.attr.attributes[k] = nil
      end
    end
  end
  
  -- return the div
  return figureDiv
  
end

-- is this element a subfigure
function isSubfigure(el)
  if el.attr.attributes["figure-parent"] then
    return true
  else
    return false
  end
end

-- is this a Div containing a figure
function isFigureDiv(el, requires)
  requires = requiresParam(requires)
  if el.t == "Div" then 
    if requires.label and not hasFigureLabel(el) then
      return false
    elseif requires.caption and figureDivCaption(el) == nil then
      return false
    else
      return true
    end
  else
    return false
  end
end

-- is this an image containing a figure
function isFigureImage(el, requires)
  requires = requiresParam(requires)
  if requires.label and not hasFigureLabel(el) then
    return false
  elseif requires.caption and #el.caption == 0 then
    return false
  else
    return true
  end
end

-- does this element have a figure label?
function hasFigureLabel(el)
  return string.find(el.attr.identifier, "^fig:")
end

function figureDivCaption(el)
  local last = el.content[#el.content]
  if last and last.t == "Para" and #el.content > 1 then
    if not (#last.content == 1 and last.content[1].t == "Image") then
      return last
    else
      return nil
    end
  else
    return nil
  end
end

function figureFromPara(el, requires)
  requires = requiresParam(requires)
  if #el.content == 1 and el.content[1].t == "Image" then
    local image = el.content[1]
    if not requires.caption or (#image.caption > 0) then
      return image
    else
      return nil
    end
  else
    return nil
  end
end

function linkedFigureFromPara(el, requires)
  requires = requiresParam(requires)
  if #el.content == 1 and el.content[1].t == "Link" then
    local link = el.content[1]
    if #link.content == 1 and link.content[1].t == "Image" then
      local image = link.content[1]
      if not requires.caption or (#image.caption > 0) then
        return image
      end
    end
  end
  return nil
end

--- process requires arg
function requiresParam(requires)
  if not requires then
    return {
      label = true,
      caption = true
    }
  else
    return requires
  end
end


