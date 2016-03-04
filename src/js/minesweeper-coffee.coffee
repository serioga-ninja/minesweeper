$.fn.disableSelection = () ->
  return this
  .attr('unselectable', 'on')
  .css('user-select', 'none')
  .on('selectstart', false);

media = {}

progress =
  xCount: 10
  yCount: 10
  cellWidth: 20
  cellHeight: 20
  minesCount: 10

# perimeter coordinates of the point
aroundCoordinates = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1]
]

defaultSizes = {
  '8x8': {
    xCount: 8,
    yCount: 8,
    minesCount: 10
  },
  '16x16': {
    xCount: 16,
    yCount: 16,
    minesCount: 40
  },
  '30x16': {
    xCount: 30,
    yCount: 16,
    minesCount: 99
  }
}

Evt = ()->

class utils
  clear: ()->
    a = []
    for i in [0..w]
      row = []
      for j in [0..h]
        row.push 0
      a.push row
    return a

  px: (number)->
    return number + 'px'

  sum: (x, y, matrix)->
    sum = 0;
    for i in [0..aroundCoordinates.length]
      sum += if matrix[x + aroundCoordinates[i][0]] and matrix[x][y + aroundCoordinates[i][1]] then matrix[x + aroundCoordinates[i][0]][y + aroundCoordinates[i][1]] else 0
    return sum

  getFlaggedCells: ()->
    sum = 0
    for i in [0..aroundCoordinates.length]
      if matrix[x + aroundCoordinates[i][0]]? and matrix[x][y + aroundCoordinates[i][1]]?
        cell = matrix[x + aroundCoordinates[i][0]][y + aroundCoordinates[i][1]]
        sum += if cell.isFlag then 1 else 0
    return sum

class Configs
  constructor: ()->


class Minesweeper
  constructor: (field, options)->
    $field = $ field
    if $field.prop "tagName" isnt 'svg'
      $('</svg>').appendTo $field
      field = field + ' svg'

    $(field).on 'contextmenu', ()->
      return false

    Snap.load 'media/mine.svg', (mine)->
      media['mine'] = mine.select 'g'

    $('.default-type.clickable').on 'click', (ev) =>
      @_config field, defaultSizes[$(ev.currentTarget).attr 'id'];


    $('.open-custom-form').on 'click', () =>
      $('.configs').hide()
      $('.custom-form').show()

    $('#cancel').on 'click', () =>
      $('.configs').show()
      $('.custom-form').hide()

    $('#start').on 'click', (event) =>
      properties = {}
      for obj in $(event.currentTarget).parents('form').serializeArray()
        properties[obj.name] = obj.value;

      @_config field, properties

  on: (event, callback)->
    if typeof callback is 'function'
      Event.methods[event] = callback

  fire: (event, args)->
    if Event.isMethodExists(event)
      Event.methods[event].call Minesweeper, Evt args

  showConfigs: ()->
    $('.configs').show();


class Event
  constructor: ()->
    @methods = {
      'open-cell': ()->
      'place-flag': ()->
      'win': ()->
        alert 'win'
        Minesweeper.showConfigs
    }

  isMethodExists: (name)->
    return @methods[name]?

class Game
  constructor: (options)->
    availableFlagsCount = options.minesCount
    totalMinesCount = options.minesCount
    closedCellCount = options.xCount * options.yCount



