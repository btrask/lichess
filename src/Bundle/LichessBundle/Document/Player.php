<?php

namespace Bundle\LichessBundle\Document;

use Bundle\LichessBundle\Chess\PieceFilter;
use Bundle\LichessBundle\Stack;

/**
 * Represents a single Chess player for one game
 *
 * @mongodb:EmbeddedDocument
 * @author     Thibault Duplessis <thibault.duplessis@gmail.com>
 */
class Player
{
    /**
     * Unique ID of the player for this game
     *
     * @var string
     * @mongodb:Field(type="string")
     */
    protected $id;

    /**
     * the player color, white or black
     *
     * @var string
     * @mongodb:Field(type="string")
     */
    protected $color = null;

    /**
     * Whether the player won the game or not
     *
     * @var boolean
     * @mongodb:Field(type="boolean")
     */
    protected $isWinner = false;

    /**
     * Whether this player is an Artificial intelligence or not
     *
     * @var boolean
     * @mongodb:Field(type="boolean")
     */
    protected $isAi = false;

    /**
     * If the player is an AI, its level represents the AI intelligence
     *
     * @var int
     * @mongodb:Field(type="int")
     */
    protected $aiLevel = null;

    /**
     * Binary data containing stack and pieces
     *
     * @var \MongoBin
     * @mongodb:Field(type="Bin")
     */
    protected $binaryData = null;

    /**
     * Event stack
     *
     * @var Stack
     */
    protected $stack = null;

    /**
     * the player current game
     *
     * @var Game
     */
    protected $game = null;

    /**
     * the player pieces
     *
     * @var array
     */
    protected $pieces = array();

    public function __construct($color)
    {
        $this->color = $color;
        $this->generateId();
        $this->stack = new Stack();
        $this->stack->addEvent(array('type' => 'start'));
    }

    /**
     * Generate a new ID - don't use once the player is saved
     *
     * @return null
     **/
    protected function generateId()
    {
        if(null !== $this->id) {
            throw new \LogicException('Can not change the id of a saved player');
        }
        $this->id = '';
        $chars = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
        $nbChars = strlen($chars);
        for ( $i = 0; $i < 4; $i++ ) {
            $this->id .= $chars[mt_rand(0, $nbChars-1)];
        }
    }

    /**
     * Get stack
     * @return Stack
     */
    public function getStack()
    {
        return $this->stack;
    }

    /**
     * Set stack
     * @param  Stack
     * @return null
     */
    public function setStack($stack)
    {
        $this->stack = $stack;
    }

    /**
     * @return string
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return string
     */
    public function getFullId()
    {
        return $this->game->getId().$this->getId();
    }

    /**
     * @return int
     */
    public function getAiLevel()
    {
        return $this->aiLevel;
    }

    /**
     * @param int
     */
    public function setAiLevel($aiLevel)
    {
        $this->aiLevel = $aiLevel;
    }

    /**
     * @return Piece\King
     */
    public function getKing()
    {
        foreach($this->pieces as $piece) {
            if($piece instanceof Piece\King) {
                return $piece;
            }
        }
    }

    /**
     * @return array
     */
    public function getPiecesByClass($class) {
        $class = '\\Bundle\\LichessBundle\\Entities\\Piece\\'.$class;
        $pieces = array();
        foreach($this->pieces as $piece) {
            if($piece instanceof $class) {
                $pieces[] = $piece;
            }
        }
        return $pieces;
    }

    public function getNbAlivePieces()
    {
        $nb = 0;
        foreach($this->pieces as $piece) {
            if(!$piece->getIsDead()) {
                ++$nb;
            }
        }

        return $nb;
    }

    public function getDeadPieces()
    {
        $pieces = array();
        foreach($this->getPieces() as $piece) {
            if($piece->getIsDead()) {
                $pieces[] = $piece;
            }
        }
        return $pieces;
    }

    /**
     * @return boolean
     */
    public function getIsAi()
    {
        return $this->isAi;
    }

    /**
     * @param boolean
     */
    public function setIsAi($isAi)
    {
        $this->isAi = $isAi;
    }

    /**
     * @return boolean
     */
    public function getIsWinner()
    {
        return $this->isWinner;
    }

    /**
     * @param boolean
     */
    public function setIsWinner($isWinner)
    {
        $this->isWinner = $isWinner;
    }

    /**
     * @return array
     */
    public function getPieces()
    {
        return $this->pieces;
    }

    /**
     * @param array
     */
    public function setPieces($pieces)
    {
        $this->pieces = $pieces;
        foreach($this->pieces as $piece) {
            $piece->setPlayer($this);
        }
    }

    public function addPiece(Piece $piece)
    {
        $this->pieces[] = $piece;
    }

    public function removePiece(Piece $piece)
    {
        $index = array_search($piece, $this->pieces);
        unset($this->pieces[$index]);
    }

    /**
     * @return Game
     */
    public function getGame()
    {
        return $this->game;
    }

    /**
     * @param Game
     */
    public function setGame($game)
    {
        $this->game = $game;
    }

    /**
     * @return string
     */
    public function getColor()
    {
        return $this->color;
    }

    /**
     * @param string
     */
    public function setColor($color)
    {
        $this->color = $color;
    }

    public function getOpponent()
    {
        return $this->getGame()->getPlayer('white' === $this->color ? 'black' : 'white');
    }

    public function getIsMyTurn()
    {
        return $this->game->getTurns() %2 xor 'white' === $this->color;
    }

    public function isWhite()
    {
        return 'white' === $this->color;
    }

    public function isBlack()
    {
        return 'black' === $this->color;
    }

    public function __toString()
    {
        $string = $this->getColor().' '.($this->getIsAi() ? 'A.I.' : 'Human');

        return $string;
    }

    public function isMyTurn()
    {
        return $this->getGame()->getTurns() %2 ? $this->isBlack() : $this->isWhite();
    }

    public function getBoard()
    {
        return $this->getGame()->getBoard();
    }

    public function encode()
    {
        $data = array(
            'pieces' => $this->pieces,
            'stack' => $this->stack
        );
        $this->binaryData = gzcompress(serialize($data), 5);
    }

    public function decode()
    {
        $data = unserialize(gzuncompress($this->binaryData));
        $this->pieces = $data['pieces'];
        $this->stack = $data['stack'];
    }
}
