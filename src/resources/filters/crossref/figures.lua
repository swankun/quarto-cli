-- figures.lua
-- Copyright (C) 2020 by RStudio, PBC

-- process all figures
function figures()
  return {
    Div = function(el)
      local requires = crossrefRequires(el)
      if isFigureDiv(el, requires) then
        local caption = figureDivCaption(el)
        processFigure(el, caption.content)
      end
      return el
    end,

    Para = function(el)
      local image = figureFromPara(el, { label = false, caption = false })
      if image then
        local requires = crossrefRequires(image)
        if isFigureImage(image, requires) then
          processFigure(image, image.caption)
        end
      end
      return el
    end
  }
end


-- process a figure, re-writing it's caption as necessary and
-- adding it to the global index of figures
function processFigure(el, captionContent)
  -- get label and base caption
  local label = el.attr.identifier
  local caption = captionContent:clone()

  -- determine order, parent, and displayed caption
  local order
  local parent = el.attr.attributes["figure-parent"]
  if (parent) then
    el.attr.attributes["figure-parent"] = nil
    order = {
      section = nil,
      order = crossref.index.nextSubfigureOrder
    }
    crossref.index.nextSubfigureOrder = crossref.index.nextSubfigureOrder + 1
   
    -- if this isn't latex output, then prepend the subfigure number
    if not isLatexOutput() then
      if inlinesToString(captionContent) == "" then
        tclear(captionContent)
      end
      tprepend(captionContent, { pandoc.Str(")"), pandoc.Space() })
      tprepend(captionContent, subfigNumber(order))
      captionContent:insert(1, pandoc.Str("("))
    end

  else
    order = indexNextOrder("fig")
    if not isLatexOutput() then
      tprepend(captionContent, figureTitlePrefix(order))
    end
  end

  -- update the index
  indexAddEntry(label, parent, order, caption)
  
end


function figureTitlePrefix(order)
  return titlePrefix("fig", "Figure", order)
end

function crossrefRequires(el)
  return {
    label = true,
    caption =  el.attr.attributes["figure-parent"] == nil
  }
end


