/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import taglineStyles from './HomeTagline.module.css';
import { classNames } from '../../utils/classNames';

/* ─── ASCII art for the Jupyter section ────────────────────────────────── */

const JUPYTER_ART_LINES: string[] = [
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                               ++++++++             ',
  '                                                                             ++++++++++++           ',
  '                                                                            ++++++++++++++          ',
  '                                                                            ++++++++++++++          ',
  '                                                                            ++++++++++++++          ',
  '                                         ==================                  ++++++++++++           ',
  '      *******                     ===============================              ++++++++             ',
  '     *********                ========================================                              ',
  '    **********             ==============================================                           ',
  '     *********          ====================================================                        ',
  '      ******         =========================================================                      ',
  '                   =============================================================                    ',
  '                 ==========================             ==========================                  ',
  '                ================                                   =================                ',
  '              ============                                                ============              ',
  '             =========                                                        =========             ',
  '           =======                                                                ======            ',
  '          =====                                                                      ====           ',
  '         ===                                                                           ===          ',
  '         =                                                                               ==         ',
  '                                                                                           =        ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                 ###                                ',
  '                                                                 ###                                ',
  '     ###     ###       ###    ###   #####     ####       ###   ########       #####        ##   ##  ',
  '     ###     ###       ###    ####### #####    ###       ###   ########     ###   ####     ## ####  ',
  '     ###     ###       ###     ###       ###    ###     ###      ###       ##       ##     ###      ',
  '     ###     ###       ###     ##         ###    ###    ##       ###      ###       ###    ###      ',
  '     ###     ###       ###     ##         ###    ###   ###       ###      #############    ###      ',
  '     ###     ###       ###     ##         ##      ### ###        ###      ###              ###      ',
  '     ###     ###      ###      ###       ###       #####         ###      ####             ###      ',
  '     ###      ###########      ############         ###          ######     ##########     ###      ',
  '     ###        ####   ##      ##   ####            ###            ####       ######                ',
  '     ###                       ##                  ###                                              ',
  '   ####                        ##                ####                                               ',
  '  ####                          ##               ###                                                ',
  '                                                                                                    ',
  '        =                                                                                  =        ',
  '         ==                                                                              ==         ',
  '          ===                                                                         ====          ',
  '           =====                                                                    =====           ',
  '            =======                                                              =======            ',
  '             ==========                                                      ==========             ',
  '              ==============                                            =============               ',
  '                ==================                               ===================                ',
  '                  ================================================================                  ',
  '                    ============================================================                    ',
  '                      ========================================================                      ',
  '                        ===================================================                         ',
  '                           =============================================                            ',
  '                               ======================================                               ',
  '             ~~~~~~                 ============================                                    ',
  '          ~~~~~~~~~~~~                      ============                                            ',
  '         ~~~~~~~~~~~~~~~                                                                            ',
  '        ~~~~~~~~~~~~~~~~                                                                            ',
  '       ~~~~~~~~~~~~~~~~~~                                                                           ',
  '        ~~~~~~~~~~~~~~~~~                                                                           ',
  '        ~~~~~~~~~~~~~~~~                                                                            ',
  '         ~~~~~~~~~~~~~~                                                                             ',
  '          ~~~~~~~~~~~~                                                                              ',
  '              ~~~~                                                                                  ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
];

/* Normalise all lines to the same width so overlays align perfectly */
const MAX_WIDTH = Math.max(...JUPYTER_ART_LINES.map((l) => l.length));
const PADDED = JUPYTER_ART_LINES.map((l) => l.padEnd(MAX_WIDTH));

/* Extract a layer that keeps only the specified characters, replacing everything
   else with spaces.  The result has identical dimensions to the full art. */
function extractLayer(lines: string[], keep: string): string {
  return lines
    .map((line) =>
      line.split('').map((c) => (keep.includes(c) ? c : ' ')).join('')
    )
    .join('\n');
}

const PLANET_LAYER = extractLayer(PADDED, '=#');
const MOON1_LAYER = extractLayer(PADDED, '*');
const MOON2_LAYER = extractLayer(PADDED, '+');
const MOON3_LAYER = extractLayer(PADDED, '~');

/* ─── Jupyter ASCII art component with orbiting moons ──────────────────── */

function JupyterAsciiArt() {
  return (
    <div className={taglineStyles.asciiContainer}>
      <div className={taglineStyles.asciiInner}>
        {/* Static planet body + "Jupyter" text */}
        <pre className={taglineStyles.asciiPlanet}>{PLANET_LAYER}</pre>
        {/* Moon 1 (★) — orbits clockwise */}
        <pre className={classNames(taglineStyles.asciiMoon, taglineStyles.asciiMoon1)}>
          {MOON1_LAYER}
        </pre>
        {/* Moon 2 (＋) — orbits counter-clockwise */}
        <pre className={classNames(taglineStyles.asciiMoon, taglineStyles.asciiMoon2)}>
          {MOON2_LAYER}
        </pre>
        {/* Moon 3 (bottom-left ～) — orbits clockwise */}
        <pre className={classNames(taglineStyles.asciiMoon, taglineStyles.asciiMoon3)}>
          {MOON3_LAYER}
        </pre>
      </div>
    </div>
  );
}

/* ─── ASCII art for the Tree section ───────────────────────────────────── */

const TREE_ART_LINES: string[] = [
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                          .                                         ',
  '                                                  ....  ..= .:-.                                    ',
  '                                                  .#=..-......=.= .. .......==.                     ',
  '                                      .. .  .....+...-.:.... + ..==.= =....@.=.                     ',
  '                                 ..:...--.. ....+. .@=..@=..@..-:=.# ...- ..- . ...                 ',
  '                             . =-. ..:+.:. .-@...-..-.@+.+#.@=..---.= =. ..:- ..=..                 ',
  '                         .=..=-% .-.:.@... -+%-....+...@....+...-.@@.=+.-:.# ......                 ',
  '                          .#.:-.#..:::..@.=.-.@.: .+-...=%.@@...: @..:-..-.*@ ..-=.=...             ',
  '                        =.= ..@==-@ .. @ ==*.:.%=.=..=..=-@@-@. ..@=:.....@.=....: =....            ',
  '                      .-..:.@ . . ..@.- @.==..==@. -+ -%@-..@..@ @@%.-..%@..%-=..=.=..+-.           ',
  '                     ...=.:.-@:..@-% @.-#@..@-=.@.=.@.@*=.@..=.@@=.-: ---.@. =@.=..-+.=-..          ',
  '                    :.#-..-.=.@.-*=.:@@.+.@@.%..@= .@.-#..@.=.@:=#.:-..= @@+.... @@ .:=..           ',
  '                ..- ...++:=.-- @@:=...@@....@@..-:=:.=....@+*@..%- .= ..@.=:-.+.@=.-=...=.          ',
  '         ..     ...   ...% .+:- @...@ . @@.-=.@-  +.= ..:..@.@=-.@ - @=...-.:@-.@..@ ..- .          ',
  '       .==.... .=:.=@#. :.%..@:*..=:....=.@.=#=@@= @ .==.@ @@. .@---*.--.=..:=.=@@:.:-. ...         ',
  '       =-.@.--.=.=..-.#@=@@. =.%@@@ ..=.+..@.=..=@= ..:.-.@@- @:.-..@@@@@@@@@@@%.-.=.%@@@-.         ',
  '       =.*. ..  +*.-.=..@.=@.-# @ @@#.=.:-#.@=@:.@@.=::#=@. -..: #@@..=%= #+@@@@@.- ...*+..         ',
  '     ..:.#.@@..+.=.. @.-% .@@- @...@@.......@@::-.@@--.@@*..=@@@@@..@. %*@@%. ::==@:+.=..--         ',
  ' .- ....-..:..@:.+... .-.@=.=@-@.=.:@-.- =.:.@.@@=:@#=*=@ .:@@-.@@::.=.*=.-.-*: #.#=@+.--...        ',
  '   ......@@....*.  : =.@ #.@@@#...#+#@.:=...=@@=@@-.@..@..%@@:-.. =-..#..@:. @-...@=.%..=..=.       ',
  '  ..--.=.:*.=#...--...=-@.=.@:=.:.-..=#@@@.==.@.- . @@ @..@@ =..=%.@-- @-.@=.:@=.  --@..=..+...     ',
  '    = .. . ... -@. *.  =#@-.@..=.:%.-.-=...@*. @=+..@@@@%@:-- =@....:-=:=....-.=..@@.-==.:.:..-=.   ',
  '       .=....:.-.%.=@@...+.@@=:..:=--.. ...@@@==@@.=@@@@@...=-... @-.=.:.@...@@@.@@=.=.-:.=....-.   ',
  '        =.:##%.@...-..#.*-..@..:.+#..+-.....-.%..%@.%@%*+..-:...-#..-:..@@@..-=.=..=.=..@ =.-... .  ',
  '            ..-.. @.= .....==@::=.=@.-..@-.:@..@@.@@@@@=@..:@-.#%*#@@@@.---=-.:@...=@@=. -:%....    ',
  '            =..=.-*..=.--..@.-#@-#...--.....=#.-=@@@@@@=.@@@@*.==..:  ...-.-@@.....- =.=.@..=.      ',
  '       .=..- -:=  ..@-@=@.-... .@.-@ .%:. @@ @...-@@@@ @@..==.=-.. -..=--@@..+.=..... .#. =...      ',
  '          .- -:.:- =@...--. -....%@ @.=......@@@..@@@@@@. .=.. @@%@@@@@+@.@@.:-.-.=..*=..+=...      ',
  '        ....=.=- .=..@@=.-.@..:+=.-*@@.....:..=.@@@@@@==-+==@@@. .-...:  . -..#@@@@. ---......      ',
  '       =.:...--@@@...-..@@@@#@@.-% -.-#@@@:.=@..@@@@@ +@@@@..=:=-- :@@@@@@@@@@=..=...  .......      ',
  '       ...=-=.--...*@@..-...-= ..@@@@#.=..@@@@:.@@@@@@..  .=:=.%@@%.. .@.. ... =...::.=-.=--.=      ',
  '     . = @...:- #..==...=++::-:.@ . ...-. -- @@@@@@@@ .=@@@@@@=@.=-.-..=-@@@@@@..@...-.%+ -. .      ',
  '     .. ... .:%.=#:+-# .:-.#+=.=...*.=.....@. .@@@@@@@@@-...:... @-..: .-.--:..=:.@.=.. -..=        ',
  '      .. #.@@@..@@+...... ..@#@@@@@@@@@@@@@@@@@@@@@@@@.    .    .:.:#=: :@-.:..=...-- @..= .        ',
  '      .-..:- -:.... ...*  @..=.=..:..-=*:..    .@@@@@@          ..--:...-@..:.= .....*=...-.        ',
  '       =....  .. ..=..@...-...  ..........       @@@@@               . .-......  .   .=..           ',
  '               .:-+-..  ..                       #@@@@                   ....                       ',
  '                   -.... .                       .@@@@                                              ',
  '                    ..                           .@@@@@                                             ',
  '                                                 *@@@@@                                             ',
  '                                                 *@@@@@                                             ',
  '                                                 #@@@@@                                             ',
  '                                                  @@@@@                                             ',
  '                                                 %@@@@@                                             ',
  '                                                  @@@@@                                             ',
  '                                                 #@@@@@                                             ',
  '                                                 @@@@@%                                             ',
  '                                                  @@@@@                                             ',
  '                                                 %@@@@@                                             ',
  '                                                  @@@@@                                             ',
  '                                                 #@@@@@                                             ',
  '                                                  @@@@@                                             ',
  '                                                 @@@@@#                                             ',
  '                                                 %@@@@@                                             ',
  '                                                  @@@@@                                             ',
  '                                                 #@@@@@                                             ',
  '                                                  @@@@@                                             ',
  '                                                 %@@@@@                                             ',
  '                                                 @@@@@%                                             ',
  '                                                  @@@@@                                             ',
  '                                                 #@@@@@                                             ',
  '                                                 @@@@@@@                                            ',
  '                               .                @@@@@@@@@                                           ',
  '          ....................::::::::::::::::*@@@@@@@@@@@:::::::::::::::::...................        ',
  '       ................::::::::::::::-:----==++**##%%%##**++==----:::::::::::::::.................    ',
  '                  .................................................................. ..             ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
  '                                                                                                    ',
];

/* Normalise tree lines to the same width */
const TREE_MAX_WIDTH = Math.max(...TREE_ART_LINES.map((l) => l.length));
const TREE_PADDED = TREE_ART_LINES.map((l) => l.padEnd(TREE_MAX_WIDTH));

/* Tree structure: trunk + dense canopy (@#%) — static */
const TREE_TRUNK_LAYER = extractLayer(TREE_PADDED, '@#%');
/* Foliage texture: dots that form the canopy fill — animated shimmer */
const TREE_LEAVES_LAYER = extractLayer(TREE_PADDED, '.');
/* Branch detail: connecting characters — static */
const TREE_BRANCHES_LAYER = extractLayer(TREE_PADDED, '=+-:*');

/* ─── Falling leaf definitions (fixed positions to avoid SSR mismatch) ─── */

const FALLING_LEAVES = [
  { x: '22%', startY: '32%', endY: '88%', duration: '10s', delay: '0s',   sway: '3.2s', char: '.' },
  { x: '35%', startY: '28%', endY: '90%', duration: '12s', delay: '2.5s', sway: '2.8s', char: ':' },
  { x: '44%', startY: '35%', endY: '85%', duration: '9s',  delay: '1s',   sway: '3.5s', char: '.' },
  { x: '55%', startY: '30%', endY: '92%', duration: '11s', delay: '4s',   sway: '2.6s', char: '*' },
  { x: '63%', startY: '26%', endY: '87%', duration: '13s', delay: '0.5s', sway: '3.8s', char: '.' },
  { x: '72%', startY: '33%', endY: '86%', duration: '10s', delay: '5s',   sway: '3.0s', char: ':' },
  { x: '30%', startY: '38%', endY: '90%', duration: '11s', delay: '7s',   sway: '2.4s', char: '.' },
  { x: '50%', startY: '25%', endY: '88%', duration: '14s', delay: '1.8s', sway: '3.4s', char: '.' },
  { x: '28%', startY: '40%', endY: '85%', duration: '12s', delay: '6s',   sway: '2.9s', char: '*' },
  { x: '58%', startY: '34%', endY: '91%', duration: '9s',  delay: '8s',   sway: '3.6s', char: '.' },
  { x: '68%', startY: '29%', endY: '87%', duration: '15s', delay: '3s',   sway: '2.5s', char: ':' },
  { x: '40%', startY: '36%', endY: '89%', duration: '11s', delay: '9.5s', sway: '3.1s', char: '.' },
];

/* ─── Tree ASCII art component with shimmering leaves ──────────────────── */

function TreeAsciiArt() {
  return (
    <div className={taglineStyles.asciiContainer}>
      <div className={taglineStyles.asciiInner}>
        {/* Trunk + dense canopy (static) */}
        <pre className={taglineStyles.asciiPlanet}>{TREE_TRUNK_LAYER}</pre>
        {/* Branch detail texture (static, slightly brighter) */}
        <pre className={classNames(taglineStyles.asciiMoon, taglineStyles.asciiTreeBranches)}>
          {TREE_BRANCHES_LAYER}
        </pre>
        {/* Foliage dots — gentle shimmer animation */}
        <pre className={classNames(taglineStyles.asciiMoon, taglineStyles.asciiTreeLeaves)}>
          {TREE_LEAVES_LAYER}
        </pre>
        {/* Falling leaves */}
        <div className={taglineStyles.fallingLeavesContainer}>
          {FALLING_LEAVES.map((leaf, i) => (
            <span
              key={i}
              className={taglineStyles.fallingLeaf}
              style={{
                '--leaf-x': leaf.x,
                '--leaf-start-y': leaf.startY,
                '--leaf-end-y': leaf.endY,
                '--leaf-duration': leaf.duration,
                '--leaf-delay': leaf.delay,
                '--leaf-sway': leaf.sway,
              } as React.CSSProperties}
            >
              {leaf.char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ASCII art for the Padlock section ─────────────────────────────── */

const PADLOCK_ART_LINES: string[] = [
  '                                           %%%%%####%#                                              ',
  '                                    %%%%%%%#####*****###%%##                                        ',
  '                                 ####*#****++****+++++=:....:-==                                    ',
  '                              %*++=+++****+=-=#+----:-==---:.. .:==                                 ',
  '                           =+*-==++***=+=--+--*=--=-==-------=-....-=                               ',
  '                         --.=-=+*****:-+=#=+=+==++++++++==*==-:---...-=                             ',
  '                       -:..:=+*#**=----===+++++++++++++++++++=---+-=...-=                           ',
  '                     ::..:.-*#%*=---+++++++***+++++++====**++++=+--+-:..:--                         ',
  '                    -..  .-+#*==--*=+++*++*###########+++####*+++++*=-::.:-=                        ',
  '                   :....-=+%*=--*==+*+*##***++====+++***##++*###++++*+--::::=                       ',
  '                  :. .:=+*#*=-====++*#*+===           ==++*#*=+=+++++**=-::::=                      ',
  '                 :. ..+*##*--=-==+***==                   =+*#*=:.:===**=-::::=                     ',
  '                 : .-=#+#*=-+--+***=-                       -=*#=-.+==+#*=-::::-                    ',
  '                :..:=*+**=-=-:+**+-                           -+*+-:+==+#*=-:::-                    ',
  '               ::..=#++++----==*=-                             -=*+=====##+=-:::-                   ',
  '               :..=**-%*--=--=*=                                ==*+=+--+##+-:::-                   ',
  '               :..+#-#*+--:-++=-                                 -+*+=+-+***=-:::=                  ',
  '              ::.=##-##=-=--=+-                                   =*+=+=+=##+-:::=-                 ',
  '              ::.+%+-%#----===                                    =+==+=*-#%*--::-=                 ',
  '             :::.+%:+%*=-:-+==                                     ==-==#=*%#=-::-=-                ',
  '             -:::*#-#%+--:-++-                                     =+--+#+*%#=-::-=-                ',
  '            ==:::*%-##=----=+-                                     -+-:+#**%%=----==                ',
  '            =+::-#*=%%+-=--=+=                                     =+-:+#*+%%=----=-                ',
  '            =+:.=*#=%%=-=--=+=                                     ==-:+##+%%=----==                ',
  '            -+::=*%=%%=-=--=+-                                     =+-:+##+%%=----==                ',
  '            -+::=#%=%%=-+--==-                                     -+-:+##=%%=----==                ',
  '            -+::=##+%%--=-:==-                                     -+-:+##=%%=----==                ',
  '            -+:.=#*=%%=-+-:+=-      ++++++++++++++++***+++****     -+-.-**+%%=----==                ',
  '            =+::=+*+%%=-=:.+=-++++*****+++++++*#####***+++-:....:-==+-.:-+*%%=----==                ',
  '            =+::+##=%%=-=:.*+++******+++*#*#***+----=----------::::::..:-*###=----==                ',
  '            =+:.++#=%%=-=+-##**+*+++*=*+**-=-+**+*+=---=---------...::::::..==----==                ',
  '            =+:.=#*+%%=-*+*%*+*+==++++=--=#*+-------------------------::----::.---==                ',
  '            =+:.=##+%%=*##+.-:-=-*+-----=+*#==-----------+=----------=---------:::+=                ',
  '            =+-.=##+%%+#==*+:.+*=-------==#-+=----------#%#-----------:+----------::                ',
  '            =+:.+%#+#%**+=..=#=----------=+*%==---------#%#-----------:-------------::              ',
  '            ++:.+##++*-.:.:#--------------=#=+=---------#%#==--------:=---------------::            ',
  '           **+::=#+.:::..*+------------=---*=%==+===+++****%**+=====-:.:::--------------::          ',
  '          **-+::---::..+*--------------=*+*-+=##@@%%@@@%#@@@@@@@%##*+==+-.:::------------::         ',
  '        ***+++-:::::..*=---------=--=#*+-=%@@@@@@%@@@-*@@%-%%%%-++%%@%%#++++:::------------::       ',
  '       ***+--:::::..=*=--=--=--===***-=%@%@@%@@@%:@@@@:@%%+=%%%-%%%+++*%@%#+++:::-----------:-      ',
  '      +++=--:::::..**==-=====-=+***=*#@@@%@@:%@@@=.@@@+@@%%@@%%-%%%-%###=#%%#*++-::---------=:-     ',
  '     +++=---:::::.+*========-=*#%-+%@@%-%@@@@:%@@@@@@@@@@@@@@%%%%%%*%##-%###*%#++=::--------=-:-    ',
  '     ++==---::::.++========-#%#+=*%@*%@@=:@@@@@@@@@@@@@@@@@@#%-%++=%%####%#=%#%%*=+-:=-------=--    ',
  '    +====---:::.+#=========#*#=%@@%-+@@@@%:@@@%#@@@@@@@@@@%%%%#%-+#%%%###%*+%%#=%#++=:-------=+:=   ',
  '   ======---::.*%==++====*%##=@%@.@@@:+@@@@@@=@@%=@@@@@%%%%%%%%+%%=%%%%###%%%#+###%+=+:------=+=-=  ',
  '   +====----::-*===++++=%%+=#@@%-%@@@@@@@@%+*%-@@%:@@%%%%%%%%%%%%+%%%%%###%%%%#%%#+%==+:-=-====*--  ',
  '  ++=====--::.-+=++++==%+*=%@@+@@+:#@@@@@@@@@-@-+=%%%%@@@@@@@@@@@@%%%%%%##%%-+%%#-##%===:=====+*=-  ',
  '  *++====--::*#=++++==**#=%@@*@@@@@@@@@@@@@@@@.@@%@@%@@@@@%%%%%%%%@@@%%%%%%%%%%%#%%%##=+=:*+===+*-= ',
  '  *+++===--::=+=++++=+%:=*@@+-:=@@@@@@@@@@@@@@@%@@@@@%@@%%%%%@%@%%%%%@@@%%#%%%##%%%-=%+=+-:*+==+*-= ',
  ' ****++==--:*#=++++=+%:#+@@%@@@@%%@@@@@@@@@@@%@@@@@@@%%%%%%**+%%%%@%%+#@@%%%#%%%+%#%%%%=+=-+++=+*-- ',
  ' ******+=--.+*+++++=*=%=#@@%@@@@@@@@@@@@@@@@@@@@@@@%%%%%#+%%++=+*#+===*%%#%%+%%-%%%%%*++=+--*+++*=: ',
  ' +*******--:=++++++=%=+%@@%@#::-@@@@@@@@@@@@@@@@%%%%%%-%@=+%@@@@@@@@@@%#=#@#%%%%%%%%+%%#=+-:*+++*=: ',
  '==+++++**+-=+=++++=*+#=@@@@@@@@@@@@@@@@@@@@@@@@%#%@%##@=*@@@@@@@@@@@@@@@@%=%%%%%%%%%%%#%=+=:+++++=- ',
  '=+++++++++=+*=++++=#-#*@@=+%@%@@@%@@@@@@@@@@@@@%%@@:@%+@@@@@@@@@@@@@@@@@@@%+*%%%%%%##=-*=++:+++++=-+',
  '=+++++++++-=*++++++%++%@@@@@%%-%#@@#@@=@@@@@@@@#%@+##*@@@@@@@@@@@@@@@%@@@@@@=%%%%%%%%%##+++-===++==+',
  '-=+===+++=--*+=++++#++@@@@@@@@@@@#-.@%+@@@@@@@@%%#*@+@@@@@@@@@@@@@@@@@@@@@@@%=@%%%%%%%%%+*+===+++=+=',
  ' =========--+====+++*+*@*==++*@@@@@@@@@@@@@@%@@%%*@+#@@@@@@@@@@@@@@@@@@@@@@@@=@#%%+%#**%+#+==+++==+=',
  ' =+====:==--+++++++=+=@@@@@@@@@@@@@@@@@@@@@@@@%%%*@=@@@@@@@@=.%@ ....-@@.@@@@+%#+%+%%%%%+*========+=',
  ' =+========-=++++++==+%@@%@@@@@@@@@@@@@@@@@@%@@%%%@=@@@@@+@:.*@.@@ @ @=@.@@@@+@%%%%*+*#=**===+===+= ',
  '  =========--++++++==+#@@====:@@@@@@@@@@@@@@@%@%%%@=%@@@@@@@@@@@%@@@@@@@@@@@@=%%+#%%%%%=%+===+===*= ',
  '  =+=======--=+===+==+*@@%@@@@@@@@@@@@@@@@@@@%@@%%@+*@@@@@@@@@@@@@@@@@@@@@@%=@#-%=%%%%#*#===+===++= ',
  '  -=*=======-=====++===@@%@@@@@@@@@@@@@@@@@@@@@@@@%@=%@@@@@@@@@@@@@@@@@@@@%=@%%%%%%*=*-%+=======+=  ',
  '   -+=======--====++==+%@@--*@@@@@@@@@@@@@@@@@@@@@%#%=%@@@@@@@@@@@@@@@@@@%=@%@%%%%%%%=%*=======++=  ',
  '    =+======---=========@@@@@@@@@@@@@@@+*+@@@@@@@@@%@%=+@@@@@@@@@@@@@@@%=#@%%@@%%=*%%#%=======++-   ',
  '     =*======--====++====@@%@++=@@@@#%@@@@#@@@@@@@@@@%%%==%%@@@@@%@@%*=%%%@@@@@@@@%%%%=+=====++=    ',
  '      =+*=====--=========+@@%@@@@@@@##@**@@@@@@@@%@@@%%@#%%*-=====-+@%%%%@@@@@%*@@%#%=+=====+*=     ',
  '       =+*=====--====+====-@@@@@%++@@@@@@@@@@@@@%%@@@@@@@@@%%%%%%#@@++@+#@*@@@@@+%##=+=====+*=-     ',
  '        -+*=================@@=#@@@@@@@@@@@@@@@@@@@%%%%%%%%%%%%@@@@%@@+@=#@@+@@%#%*=+=====+*=-      ',
  '         ==*#================@@%@@@%=%@@@@@@@@@@@@@#@*@@++@%@@@@@@@+@@*@#@@@@*%%#=+=====*#+=        ',
  '           =+*#===-===========-@@++@@@@@@@@@@@@@@@+@@@%+@@@@@@@@@@@@@@@@**@@%#%+=*====+**+=         ',
  '             =+*#===-==========-#@@@@@++@@@@@@@@@@@@+@+@@#@@@@@@@@@@%*@@@*%##+=#====*##+=-          ',
  '              ==+*#==-========+==-+@@#%@@@@+@@@@@@@@@@@@@@@@@@@@@+@@@+@%%#*=+#+===+##*+=            ',
  '                ==+*#===========++=-:%@@@**@@@@=@@@@+@@@+@@@*#@@@+@@%%#*+=*#+==+*##*+=              ',
  '                   =+*#*==+========+==-:#%@@%@+@@@@+@@@@+@@@+@@@%@#**==*#******##*+=                ',
  '                     ==**#===+====-==++===:::#%@@@@@%%%@%%@%%#**+-=+*#******###*+=                  ',
  '                       -=+*##+=++========+++===--:-:::------===+##*+*****#%##*+-                    ',
  '                          -=+*##*++*===========*#####*#####**+++++**###%##*+=-                      ',
  '                             -=+**###%##*+===========+++++*****####%######**++==                         ',
  '                                 ==+***####%%%%############%######**++==                            ',
  '                                     --=++****###########*****++==--                                ',
  '                                           ===-==========---=                                       ',
];

/* Normalise padlock lines to the same width */
const PADLOCK_MAX_WIDTH = Math.max(...PADLOCK_ART_LINES.map((l) => l.length));
const PADLOCK_PADDED = PADLOCK_ART_LINES.map((l) => l.padEnd(PADLOCK_MAX_WIDTH));

/* Padlock body: shackle + lock outline (static) */
const PADLOCK_BODY_LAYER = extractLayer(PADLOCK_PADDED, '%#*+=-.:');
/* Combination dial: @ characters — spins continuously */
const PADLOCK_DIAL_LAYER = extractLayer(PADLOCK_PADDED, '@');

/* ─── Padlock ASCII art component with spinning dial ─────────────────── */

function PadlockAsciiArt() {
  return (
    <div className={taglineStyles.asciiContainer}>
      <div className={taglineStyles.asciiInner}>
        {/* Static padlock body + shackle */}
        <pre className={taglineStyles.asciiPlanet}>{PADLOCK_BODY_LAYER}</pre>
        {/* Combination dial — spins continuously */}
        <pre className={classNames(taglineStyles.asciiMoon, taglineStyles.asciiPadlockDial)}>
          {PADLOCK_DIAL_LAYER}
        </pre>
      </div>
    </div>
  );
}

/* ─── SVG Icons ────────────────────────────────────────────────────────── */

const ShieldIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const JupyterIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ─── Timeline data ────────────────────────────────────────────────────── */

interface TimelineItemData {
  id: string;
  icon: JSX.Element;
  headline: string;
  bullets: string[];
  visual: JSX.Element;
}

const ITEMS: TimelineItemData[] = [
  {
    id: 'private',
    icon: <ShieldIcon />,
    headline: 'Private by design',
    bullets: [
      'Runs 100% on your infrastructure. Enterprises send no data to Mito',
      'Bring your own API keys for Azure, AWS, LiteLLM, or other LLM providers',
      'Runs in your existing local Jupyter Lab, JupyterHub, or other notebook environments',
    ],
    visual: <PadlockAsciiArt />,
  },
  {
    id: 'jupyter',
    icon: <JupyterIcon />,
    headline: 'Jupyter-native',
    bullets: [
      'Understands notebook file formats, cell context, and kernel state',
      'Compatible with all of your existing Jupyter extensions and workflows',
      'Built as a Jupyter extension, not bolted on as an afterthought',
    ],
    visual: <JupyterAsciiArt />,
  },
  {
    id: 'everyone',
    icon: <UsersIcon />,
    headline: 'Built for every skill level',
    bullets: [
      'Analysts automate Excel reports without writing code from scratch',
      'Data scientists accelerate EDA, visualization, and feature engineering',
      'ML engineers build and iterate on models faster with AI assistance',
    ],
    visual: <TreeAsciiArt />,
  },
];

/* ─── Timeline item ────────────────────────────────────────────────────── */

function TimelineItem({
  item,
  isExpanded,
  onToggle,
}: {
  item: TimelineItemData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={classNames(taglineStyles.timelineItem, {
        [taglineStyles.timelineItemExpanded]: isExpanded,
      })}
    >
      {/* Node (icon circle) sitting on the line */}
      <div className={taglineStyles.timelineNode}>
        <div
          className={classNames(taglineStyles.nodeCircle, {
            [taglineStyles.nodeCircleActive]: isExpanded,
          })}
        >
          {item.icon}
        </div>
      </div>

      {/* Content to the right of the node */}
      <div className={taglineStyles.timelineContent}>
        <div
          className={taglineStyles.timelineHeader}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
        >
          <h3 className={taglineStyles.timelineHeadline}>{item.headline}</h3>
          <span
            className={classNames(taglineStyles.chevron, {
              [taglineStyles.chevronOpen]: isExpanded,
            })}
          >
            <ChevronIcon />
          </span>
        </div>

        {/* Expandable description panel */}
        <div
          className={classNames(taglineStyles.expandable, {
            [taglineStyles.expandableOpen]: isExpanded,
          })}
          role="region"
        >
          <div className={taglineStyles.expandableInner}>
            <ul className={taglineStyles.bulletList}>
              {item.bullets.map((bullet, i) => (
                <li key={i} className={taglineStyles.bulletItem}>{bullet}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */

const HomeTagline = (): JSX.Element => {
  const [expandedId, setExpandedId] = useState<string | null>('private');

  /* Find the visual for the currently expanded item */
  const expandedItem = ITEMS.find((item) => item.id === expandedId);
  const activeVisual = expandedItem?.visual ?? null;

  return (
    <div className={taglineStyles.container}>
      <div className={taglineStyles.twoColumnLayout}>
        {/* Left column: accordion timeline */}
        <div className={taglineStyles.timeline}>
          {/* Single continuous vertical line */}
          <div className={taglineStyles.timelineLine} aria-hidden="true" />

          {ITEMS.map((item) => (
            <TimelineItem
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === item.id ? null : item.id))
              }
            />
          ))}
        </div>

        {/* Right column: ASCII art visual */}
        <div className={taglineStyles.visualColumn}>
          {expandedId && activeVisual && (
            <div
              key={expandedId}
              className={classNames(
                taglineStyles.visualCard,
                taglineStyles.visualCardVisible,
              )}
            >
              {activeVisual}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeTagline;
