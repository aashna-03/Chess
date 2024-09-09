import pygame
pygame.init()
<<<<<<< HEAD
WIDTH=1500
=======
WIDTH=1200
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309
HEIGHT=800
screen=pygame.display.set_mode([WIDTH,HEIGHT])
pygame.display.set_caption('Two-player Chess')
font = pygame.font.SysFont('Arial', 28)
big_font=pygame.font.SysFont('freesansbold.ttt',40)
timer=pygame.time.Clock()
fps=60

<<<<<<< HEAD
white_pieces=['rook','knight','bishop','king','queen','bishop','knight','rook','pawn','pawn','pawn','pawn','pawn','pawn','pawn','pawn']
white_locations=[(0,0),(1,0),(2,0),(3,0),(4,0),(5,0),(6,0),(7,0),
                 (0,1),(1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1)]

black_pieces=['rook','knight','bishop','king','queen','bishop','knight','rook','pawn','pawn','pawn','pawn','pawn','pawn','pawn','pawn']
=======
white_pieces={'rook','knight','bishop','king','queen','bishop','knight','rook','pawn','pawn','pawn','pawn','pawn','pawn','pawn','pawn'}
white_locations=[(0,0),(1,0),(2,0),(3,0),(4,0),(5,0),(6,0),(7,0),
                 (0,1),(1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1)]

black_pieces={'rook','knight','bishop','king','queen','bishop','knight','rook','pawn','pawn','pawn','pawn','pawn','pawn','pawn','pawn'}
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309
black_locations=[(0,7),(1,7),(2,7),(3,7),(4,7),(5,7),(6,7),(7,7),
                 (0,6),(1,6),(2,6),(3,6),(4,6),(5,6),(6,6),(7,6)]
capture_pieces_white=[]
capture_pieces_black=[]
  
turn_step=0
selection=100
valid_moves=[]

<<<<<<< HEAD
black_queen=pygame.image.load('A:/chess ai/pieces/images/black queen.png')
black_queen=pygame.transform.scale(black_queen,(80,80))
black_queen_small=pygame.transform.scale(black_queen,(45,45))

white_queen=pygame.image.load('A:\chess ai\pieces\images\white queen.png')
white_queen=pygame.transform.scale(white_queen,(80,80))
white_queen_small=pygame.transform.scale(white_queen,(45,45))

black_king=pygame.image.load('A:/chess ai/pieces/images/black king.png')
black_king=pygame.transform.scale(black_king,(80,80))
black_king_small=pygame.transform.scale(black_king,(45,45))

white_king=pygame.image.load('A:\chess ai\pieces\images\white king.png')
=======
black_queen=pygame.image.load('A:/chess ai/pieces/images/black queen.jpg')
black_queen=pygame.transform.scale(black_queen,(80,80))
black_queen_small=pygame.transform.scale(black_queen,(45,45))

white_queen=pygame.image.load('A:\chess ai\pieces\images\white queen.jpg')
white_queen=pygame.transform.scale(white_queen,(80,80))
white_queen_small=pygame.transform.scale(white_queen,(45,45))

black_king=pygame.image.load('A:\chess ai\pieces\images\white king.jpg')
black_king=pygame.transform.scale(black_king,(80,80))
black_king_small=pygame.transform.scale(black_king,(45,45))

white_king=pygame.image.load('A:\chess ai\pieces\images\white queen.jpg')
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309
white_king=pygame.transform.scale(white_king,(80,80))
white_king_small=pygame.transform.scale(white_king,(45,45))

black_rook=pygame.image.load('A:/chess ai/pieces/images/black rook.png')
black_rook=pygame.transform.scale(black_rook,(80,80))
black_rook_small=pygame.transform.scale(black_rook,(45,45))

<<<<<<< HEAD
white_rook=pygame.image.load('A:\chess ai\pieces\images\white rook.png')
=======
white_rook=pygame.image.load('A:\chess ai\pieces\images\white rook.jpg')
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309
white_rook=pygame.transform.scale(white_rook,(80,80))
white_rook_small=pygame.transform.scale(white_rook,(45,45))

black_bishop=pygame.image.load('A:/chess ai/pieces/images/black bishop.png')
black_bishop=pygame.transform.scale(black_bishop,(80,80))
black_bishop_small=pygame.transform.scale(black_bishop,(45,45))

white_bishop=pygame.image.load('A:\chess ai\pieces\images\white bishop.png')
white_bishop=pygame.transform.scale(white_bishop,(80,80))
white_bishop_small=pygame.transform.scale(white_bishop,(45,45))

<<<<<<< HEAD
black_knight=pygame.image.load('A:/chess ai/pieces/images/black knight.png')
black_knight=pygame.transform.scale(black_knight,(80,80))
black_knight_small=pygame.transform.scale(black_knight,(45,45))

white_knight=pygame.image.load('A:\chess ai\pieces\images\white knight.png')
white_knight=pygame.transform.scale(white_knight,(80,80))
white_knight_small=pygame.transform.scale(white_knight,(45,45))

black_pawn=pygame.image.load('A:/chess ai/pieces/images/black pawn.png')
black_pawn=pygame.transform.scale(black_pawn,(80,80))
black_pawn_small=pygame.transform.scale(black_pawn,(45,45))

white_pawn=pygame.image.load('A:\chess ai\pieces\images\white pawn.png')
=======
black_knight=pygame.image.load('A:/chess ai/pieces/images/black knight.jpg')
black_knight=pygame.transform.scale(black_knight,(80,80))
black_knight_small=pygame.transform.scale(black_knight,(45,45))

white_knight=pygame.image.load('A:\chess ai\pieces\images\white bishop.png')
white_knight=pygame.transform.scale(white_knight,(80,80))
white_knight_small=pygame.transform.scale(white_knight,(45,45))

black_pawn=pygame.image.load('A:/chess ai/pieces/images/black pawn.jpg')
black_pawn=pygame.transform.scale(black_pawn,(80,80))
black_pawn_small=pygame.transform.scale(black_pawn,(45,45))

white_pawn=pygame.image.load('A:\chess ai\pieces\images\white pawn.jpg')
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309
white_pawn=pygame.transform.scale(white_pawn,(80,80))
white_pawn_small=pygame.transform.scale(white_pawn,(45,45))


<<<<<<< HEAD
white_images = [white_pawn, white_rook, white_knight, white_bishop, white_queen, white_king]
small_white_images = [white_pawn_small, white_rook_small, white_knight_small, white_bishop_small, white_queen_small, white_king_small]

black_images = [black_pawn, black_rook, black_knight, black_bishop, black_queen, black_king]
small_black_images = [black_pawn_small, black_rook_small, black_knight_small, black_bishop_small, black_queen_small, black_king_small]

piece_list = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'] #according to indexing given to images list
=======
white_images=[white_pawn,white_queen,white_king,white_knight,white_bishop,white_rook]
small_white_images=[white_pawn_small,white_queen_small,white_king_small,white_knight_small,white_bishop_small,white_rook_small]

black_images=[black_pawn,black_queen,black_king,black_knight,black_bishop,black_rook]
small_black_images=[black_pawn_small,black_queen_small,black_king_small,black_knight_small,black_bishop_small,black_rook_small]

piece_list=['pawn','queen','king','knight','rook','bishop'] #according to indexing given to images list
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309

WHITE = (255, 255, 255)
DARK_GREEN= (100, 200, 50)


def draw_board():
<<<<<<< HEAD
    for row in range(9):
        for column in range(9):
=======
    for row in range(8):
        for column in range(8):
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309
        
         if (row + column) % 2:
         
          color = WHITE
          pygame.draw.rect(screen, color, [column * 100, row * 100, 100, 100])
        
        
        color=DARK_GREEN
        pygame.draw.rect(screen, color, [column * 100, row * 100, 100, 100])
<<<<<<< HEAD
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
       screen.blit(white_pawn,(white_locations[i][0]*100+2,white_locations[i][1]*100+20))
      else:
         screen.blit(white_images[index],(white_locations[i][0]*100+22,white_locations[i][1]*100+10))

   for i in range(len(black_pieces)):
      black_pieces_list = list(black_pieces)
      index = piece_list.index(black_pieces_list[i])
      if black_pieces_list[i] == 'pawn':
       screen.blit(black_pawn,(black_locations[i][0]*100,black_locations[i][1]*100))
      else:
         screen.blit(black_images[index],(black_locations[i][0]*100,black_locations[i][1]*100))
=======
        rect = pygame.Rect(700, 0, 200, 800)
        pygame.draw.rect(screen, 'gold',rect,width=3)
        

         
         
        rect = pygame.Rect(900, 250, 300, 400)
        pygame.draw.rect(screen, 'black',rect,width=5) 
               
         


        
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309



run=True
while run:
    timer.tick(fps)

    screen.fill('dark green')
    draw_board()
<<<<<<< HEAD
    draw_pieces()
=======
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309

    for event in pygame.event.get():
        if event.type==pygame.QUIT:
            run=False
    pygame.display.flip()
pygame.quit()
<<<<<<< HEAD

=======
>>>>>>> ec246c91c9e096925e614aa7d177c75014e79309
