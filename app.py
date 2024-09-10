import pygame
pygame.init()
WIDTH=1500
HEIGHT=800
screen=pygame.display.set_mode([WIDTH,HEIGHT])
pygame.display.set_caption('Two-player Chess')
font = pygame.font.SysFont('Arial', 28)
big_font=pygame.font.SysFont('freesansbold.ttt',40)
timer=pygame.time.Clock()
fps=60

white_pieces=['rook','knight','bishop','king','queen','bishop','knight','rook','pawn','pawn','pawn','pawn','pawn','pawn','pawn','pawn']
white_locations=[(0,0),(1,0),(2,0),(3,0),(4,0),(5,0),(6,0),(7,0),
                 (0,1),(1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1)]

black_pieces=['rook','knight','bishop','king','queen','bishop','knight','rook','pawn','pawn','pawn','pawn','pawn','pawn','pawn','pawn']
black_locations=[(0,7),(1,7),(2,7),(3,7),(4,7),(5,7),(6,7),(7,7),
                 (0,6),(1,6),(2,6),(3,6),(4,6),(5,6),(6,6),(7,6)]
captured_pieces_white=[]
captured_pieces_black=[]
  
turn_step=0
selection=100
valid_moves=[]

black_queen=pygame.image.load('A:/chess ai/chess/pieces/images/black queen.png')
black_queen=pygame.transform.scale(black_queen,(80,80))
black_queen_small=pygame.transform.scale(black_queen,(45,45))

white_queen=pygame.image.load('A:/chess ai/chess/pieces/images/white queen.png')
white_queen=pygame.transform.scale(white_queen,(80,80))
white_queen_small=pygame.transform.scale(white_queen,(45,45))

black_king=pygame.image.load('A:/chess ai/chess/pieces/images/black king.png')
black_king=pygame.transform.scale(black_king,(80,80))
black_king_small=pygame.transform.scale(black_king,(45,45))

white_king=pygame.image.load('A:/chess ai/chess/pieces/images/white king.png')
white_king=pygame.transform.scale(white_king,(80,80))
white_king_small=pygame.transform.scale(white_king,(45,45))

black_rook=pygame.image.load('A:/chess ai/chess/pieces/images/black rook.png')
black_rook=pygame.transform.scale(black_rook,(80,80))
black_rook_small=pygame.transform.scale(black_rook,(45,45))

white_rook=pygame.image.load('A:/chess ai/chess/pieces/images/white rook.png')
white_rook=pygame.transform.scale(white_rook,(80,80))
white_rook_small=pygame.transform.scale(white_rook,(45,45))

black_bishop=pygame.image.load('A:/chess ai/chess/pieces/images/black bishop.png')
black_bishop=pygame.transform.scale(black_bishop,(80,80))
black_bishop_small=pygame.transform.scale(black_bishop,(45,45))

white_bishop=pygame.image.load('A:/chess ai/chess/pieces/images/white bishop.png')
white_bishop=pygame.transform.scale(white_bishop,(80,80))
white_bishop_small=pygame.transform.scale(white_bishop,(45,45))

black_knight=pygame.image.load('A:/chess ai/chess/pieces/images/black knight.png')
black_knight=pygame.transform.scale(black_knight,(80,80))
black_knight_small=pygame.transform.scale(black_knight,(45,45))

white_knight=pygame.image.load('A:/chess ai/chess/pieces/images/white knight.png')
white_knight=pygame.transform.scale(white_knight,(80,80))
white_knight_small=pygame.transform.scale(white_knight,(45,45))

black_pawn=pygame.image.load('A:/chess ai/chess/pieces/images/black pawn.png')
black_pawn=pygame.transform.scale(black_pawn,(80,80))
black_pawn_small=pygame.transform.scale(black_pawn,(45,45))

white_pawn=pygame.image.load('A:/chess ai/chess/pieces/images/white pawn.png')
white_pawn=pygame.transform.scale(white_pawn,(80,80))
white_pawn_small=pygame.transform.scale(white_pawn,(45,45))


white_images = [white_pawn, white_rook, white_knight, white_bishop, white_queen, white_king]
small_white_images = [white_pawn_small, white_rook_small, white_knight_small, white_bishop_small, white_queen_small, white_king_small]

black_images = [black_pawn, black_rook, black_knight, black_bishop, black_queen, black_king]
small_black_images = [black_pawn_small, black_rook_small, black_knight_small, black_bishop_small, black_queen_small, black_king_small]

piece_list = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'] #according to indexing given to images list

WHITE = (255, 255, 255)
DARK_GREEN= (100, 200, 50)


def draw_board():
    for row in range(9):
        for column in range(9):
        
         if (row + column) % 2:
         
          color = WHITE
          pygame.draw.rect(screen, color, [column * 100, row * 100, 100, 100])
        
        
        color=DARK_GREEN
        pygame.draw.rect(screen, color, [column * 100, row * 100, 100, 100])
        rect = pygame.Rect(800, 0, 200, 800)
        pygame.draw.rect(screen, 'gold',rect,width=3)
        
    rect = pygame.Rect(1010, 250, 470, 400)
    pygame.draw.rect(screen, 'black',rect,width=5) 
    status_text=['White: select a piece to move!', 'White:Select the destination',
               'Black: select a piece to move !', 'Black:Select the destination']
    screen.blit(big_font.render(status_text[turn_step],True,'white'),(1020,350))
         

def draw_pieces():
   for i in range(len(white_pieces)):
      white_pieces_list = list(white_pieces)
      index=piece_list.index(white_pieces_list[i])
      if white_pieces_list[i] == 'pawn':
       screen.blit(white_pawn,(white_locations[i][0]*100+10,white_locations[i][1]*100+10))
      else:
         screen.blit(white_images[index],(white_locations[i][0]*100+10,white_locations[i][1]*100+10))
      if turn_step<2:
        if selection==i:
            pygame.draw.rect(screen,'red',[white_locations[i][0]*100+1,white_locations[i][1]*100+1,100,100],4)

   for i in range(len(black_pieces)):
      black_pieces_list = list(black_pieces)
      index = piece_list.index(black_pieces_list[i])
      if black_pieces_list[i] == 'pawn':
       screen.blit(black_pawn,(black_locations[i][0]*100+10,black_locations[i][1]*100+10))
      else:
         screen.blit(black_images[index],(black_locations[i][0]*100+10,black_locations[i][1]*100+10))
      if turn_step<2:
         if selection==i:
            pygame.draw.rect(screen,'blue',[black_locations[i][0]*100+1,black_locations[i][1]*100+1,100,100],4)

def check_options(pieces,locations,turn):
   moves_list=[]
   all_moves_list=[]
   for i in range(pieces):
      location=locations[i]
      piece=pieces[i]
      if piece=='pawn':
          moves_list=check_pawn(location,turn)
      '''elif piece=='rook':
         moves_list=check_rook(location,turn)
      elif piece=='knight':
         moves_list=check_knight(location,turn)
      elif piece=='bishop':
         moves_list=check_bishop(location,turn)
      elif piece=='queen':
         moves_list=check_queen(location,turn)
      elif piece=='king':
         moves_list=check_king(location,turn)
      all_moves_list.append(moves_list)'''

         
      return all_moves_list
   
def check_pawn(position,color):
      moves_list=[]
      if color=='white':
         if (position[0],position[1]+1)not in white_locations and \
         (position[0],position[1]+1)not in black_locations and position[1]<7:
            moves_list.append((position[0],position[1]+1))
         if (position[0],position[1]+2)not in white_locations and \
         (position[0],position[1]+1)not in black_locations and position[1]==1:
            moves_list.append((position[0],position[1]+2))
         #diagonal attack by pawn to right (+1)
         if (position[0]+1,position[1]+1) in black_locations: 
          moves_list.append((position[0]+1,position[1]+1))
          #diagonal attack by pawn to the left (-1)
         if (position[0]-1,position[1]+1) in black_locations: 
          moves_list.append((position[0]+1,position[1]+1))

      if color=='black':
         if (position[0],position[1]-1)not in white_locations and \
         (position[0],position[1]-1)not in black_locations and position[1]>0:
            moves_list.append((position[0],position[1]-1))
         if (position[0],position[1]-2)not in white_locations and \
         (position[0],position[1]-1)not in black_locations and position[1]==6:
            moves_list.append((position[0],position[1]+2))
         #diagonal attack by pawn to right (+1)
         if (position[0]+1,position[1]-1) in white_locations: 
          moves_list.append((position[0]-1,position[1]+1))
          #diagonal attack by pawn to the left (-1)
         if (position[0]-1,position[1]-1) in white_locations: 
          moves_list.append((position[0]-1,position[1]+1))
      return moves_list

def draw_valid():
   pass

def check_valid_moves



black_options=check_options(black_pieces,black_locations,'black')
white_options=check_options(white_pieces,white_locations,'white')
   
run=True
while run:
    timer.tick(fps)

    screen.fill('dark green')
    draw_board()
    draw_pieces()
    if selection !=100:
       valid_moves=check_valid_moves()
       draw_valid(valid_moves)

    for event in pygame.event.get():
        if event.type==pygame.QUIT:
            run=False
        if event.type==pygame.MOUSEBUTTONDOWN and event.button==1:
           x_coord=event.pos[0]//100
           y_coord=event.pos[1]//100
           click_coords=(x_coord,y_coord)
        if turn_step<=1:
         if click_coords in white_locations:
            selection=white_locations.index(click_coords)
            if turn_step==0:
               turn_step=1
            if click_coords in valid_moves and selection!=100:
               white_locations[selection]=click_coords
               if click_coords in black_locations:
                  black_piece=black_locations.index(click_coords)
                  captured_pieces_white.append(black_pieces[black_piece])
                  black_pieces.pop(black_piece)
                  black_locations.pop(black_piece)
                  black_options=check_options(black_pieces,black_locations,'black')
                  white_options=check_options(white_pieces,white_locations,'white')
                  turn_step=2
                  selection=100
                  valid_moves=[]
        if turn_step>1:
         if click_coords in black_locations:
            selection=black_locations.index(click_coords)
            if turn_step==2:
               turn_step=3
            if click_coords in valid_moves and selection!=100:
               black_locations[selection]=click_coords
               if click_coords in white_locations:
                  white_piece=white_locations.index(click_coords)
                  captured_pieces_black.append(white_pieces[white_piece])
                  white_pieces.pop(white_piece)
                  white_locations.pop(white_piece)
                  black_options=check_options(black_pieces,black_locations,'black')
                  white_options=check_options(white_pieces,white_locations,'white')
                  turn_step=0
                  selection=100
                  valid_moves=[]

         
    
         pygame.display.flip()
         pygame.quit()

