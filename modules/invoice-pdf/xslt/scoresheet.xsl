<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="2.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:fox="http://xmlgraphics.apache.org/fop/extensions"
                xmlns:fo="http://www.w3.org/1999/XSL/Format"
                xmlns:mat="http://blackberryconsulting.com.au/matchscoresheet">
    <xsl:output method="xml" indent="yes"/>
    <xsl:variable name="cps" select="52 - (2 * /mat:matchsummary/mat:scoresheet/mat:maxQShooters) - (2 * /mat:matchsummary/mat:scoresheet/mat:maxGShooters)"/>
    <xsl:template match="mat:matchsummary">
        <fo:root>
            <fo:layout-master-set>
                <fo:simple-page-master master-name="A4-portrait" page-height="420mm" page-width="297mm" margin="5mm">
                    <fo:region-body margin-top="33mm" margin-bottom="10mm"/>
                    <fo:region-before extent="33mm"/>
                    <!--                    <fo:region-after extent="8mm" background-color="#eeeeee"/>-->
                </fo:simple-page-master>
            </fo:layout-master-set>
            <fo:page-sequence master-reference="A4-portrait">
                <fo:static-content flow-name="xsl-region-before">
                    <fo:block text-align="center" padding="0">
                        <fo:table table-layout="fixed" width="287mm" border-left="none" font-size="110%"
                                  margin-top="0" margin-bottom="0">
                            <fo:table-column column-width="75mm"/>
                            <fo:table-column column-width="145mm"/>
                            <fo:table-column column-width="67mm"/>
                            <fo:table-body>
                                <fo:table-row background-color="white" height="33mm">
                                    <fo:table-cell display-align="after">
                                        <fo:block text-align="center" padding="0" font-size="0" min-height="33mm">
                                            <fo:external-graphic height="20mm" content-height="scale-to-fit"
                                                                 display-align="after"
                                                                 src="url('https://nbscore.blackberryconsulting.com.au/images/netball_tas.jpg')">
                                            </fo:external-graphic>
                                        </fo:block>
                                    </fo:table-cell>
                                    <fo:table-cell display-align="after" font-weight="700">
                                        <fo:block text-align="center" padding="4pt">
                                            TASMANIAN NETBALL LEAGUE
                                        </fo:block>
                                        <fo:block text-align="center" padding="4pt" padding-after="6pt">
                                            SCORE SHEET
                                        </fo:block>
                                    </fo:table-cell>
                                    <fo:table-cell>
                                        <fo:block text-align="center" padding="0">
                                        </fo:block>
                                    </fo:table-cell>
                                </fo:table-row>
                            </fo:table-body>
                        </fo:table>
                    </fo:block>
                </fo:static-content>
                <fo:flow flow-name="xsl-region-body">
                    <fo:block text-align="center" padding-top="4mm">
                        <fo:table table-layout="fixed" width="287mm" font-size="110%" margin-top="0" margin-bottom="0">
                            <fo:table-column column-width="75mm"/>
                            <fo:table-column column-width="168mm"/>
                            <fo:table-body>
                                <fo:table-row background-color="white">
                                    <fo:table-cell>
                                        <fo:block>
                                            <!--                                             Team Details Section-->
                                            <fo:table table-layout="fixed" width="75mm" font-size="60%" text-align="left" margin-top="0" margin-bottom="0"
                                                      border-collapse="collapse" padding="0">
                                                <fo:table-column column-width="6mm"/>
                                                <fo:table-column column-width="16mm"/>
                                                <fo:table-column column-width="17mm"/>
                                                <fo:table-column column-width="9mm"/>
                                                <fo:table-column column-width="9mm"/>
                                                <fo:table-column column-width="9mm"/>
                                                <fo:table-column column-width="9mm"/>
                                                <fo:table-body>
                                                    <fo:table-row height="5.55mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0 solid black">
                                                            <fo:block>
                                                                <fo:leader/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Event:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:info/mat:event/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Round:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:info/mat:round/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Venue:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:info/mat:venue/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Date:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:info/mat:date/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Team 1:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:homeTeam/mat:name/text()"/>
                                                                <fo:inline font-style="italic" padding-right="2mm" font-size="80%">
                                                                    [<xsl:value-of select="/mat:matchsummary/mat:homeTeam/mat:initial/text()"/>]
                                                                </fo:inline>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Team 2:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:awayTeam/mat:name/text()"/>
                                                                <fo:inline font-style="italic" padding-right="2mm" font-size="80%">
                                                                    [<xsl:value-of select="/mat:matchsummary/mat:awayTeam/mat:initial/text()"/>]
                                                                </fo:inline>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Umpire 1:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:info/mat:umpires[1]/mat:name/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Umpire 2:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:info/mat:umpires[2]/mat:name/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Reserve Umpire:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:info/mat:umpires[3]/mat:name/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Start Time:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:scoresheet/mat:startTime/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black" display-align="center">
                                                            <fo:block margin-left="1mm">
                                                                <fo:inline-container width="25mm">
                                                                    <fo:block font-weight="bold">Full Time:</fo:block>
                                                                </fo:inline-container>
                                                                <xsl:value-of select="mat:scoresheet/mat:endTime/text()"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7" border="0.35mm solid black">
                                                            <fo:block>
                                                                <fo:leader/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7">
                                                            <fo:block>
                                                                <fo:leader/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.45mm">
                                                        <fo:table-cell number-columns-spanned="7" display-align="center">
                                                            <fo:block margin-left="2mm" font-weight="bold">
                                                                Team 1:
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="3" border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                Names
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                1
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                2
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                3
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                4
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <xsl:call-template name="playerDetails">
                                                        <xsl:with-param name="players" select="mat:homeTeam/mat:players"/>
                                                        <xsl:with-param name="index" select="1"/>
                                                        <xsl:with-param name="maxValue" select="12"/>
                                                    </xsl:call-template>

                                                    <xsl:call-template name="teamDetails">
                                                        <xsl:with-param name="team" select="mat:homeTeam"/>
                                                    </xsl:call-template>

                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="7">
                                                            <fo:block>
                                                                <fo:leader/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.45mm">
                                                        <fo:table-cell number-columns-spanned="7" display-align="center">
                                                            <fo:block margin-left="2mm" font-weight="bold">
                                                                Team 2:
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <fo:table-row height="5.1mm">
                                                        <fo:table-cell number-columns-spanned="3" border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                Names
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                1
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                2
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                3
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell border="0.35mm solid black" display-align="center">
                                                            <fo:block text-align="center">
                                                                4
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                    <xsl:call-template name="playerDetails">
                                                        <xsl:with-param name="players" select="mat:awayTeam/mat:players"/>
                                                        <xsl:with-param name="index" select="1"/>
                                                        <xsl:with-param name="maxValue" select="12"/>
                                                    </xsl:call-template>
                                                    <xsl:call-template name="teamDetails">
                                                        <xsl:with-param name="team" select="mat:awayTeam"/>
                                                    </xsl:call-template>
                                                    <fo:table-row height="41.55mm">
                                                        <fo:table-cell number-columns-spanned="7" display-align="before">
                                                            <fo:block font-weight="bold" margin-left="1mm" margin-top="2mm" margin-right="1mm" text-align="justify">
                                                                COMMENTS:
                                                                <fo:inline wrap-option="wrap" font-size="7pt" font-weight="normal" text-align="justify">
                                                                <xsl:value-of select="/mat:matchsummary/mat:info/mat:comments/text()"/>
                                                                </fo:inline>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                </fo:table-body>
                                            </fo:table>
                                        </fo:block>
                                    </fo:table-cell>
                                    <fo:table-cell>
                                        <fo:block>
                                            <!--                                            Quarter 4-->
                                            <xsl:call-template name="periodTable">
                                                <xsl:with-param name="periods" select="mat:scoresheet/mat:periods"/>
                                                <xsl:with-param name="maxQShooters" select="number(mat:scoresheet/mat:maxQShooters/text())"/>
                                                <xsl:with-param name="maxGShooters" select="number(mat:scoresheet/mat:maxGShooters/text())"/>
                                            </xsl:call-template>
                                        </fo:block>
                                    </fo:table-cell>
                                    <!--                                    number card-->
                                    <!--                                    <fo:table-cell>-->
                                    <!--                                        <fo:block>-->
                                    <!--                                        </fo:block>-->
                                    <!--                                    </fo:table-cell>-->
                                </fo:table-row>
                            </fo:table-body>
                        </fo:table>
                    </fo:block>
                    <xsl:for-each select="mat:scoresheet/mat:periods">
                        <xsl:call-template name="ruler">
                            <xsl:with-param name="periods" select="/mat:matchsummary/mat:scoresheet/mat:periods"/>
                            <xsl:with-param name="entries" select="count(/mat:matchsummary/mat:scoresheet/mat:periods)"/>
                            <xsl:with-param name="index" select="1"/>
                        </xsl:call-template>
                    </xsl:for-each>
                </fo:flow>
            </fo:page-sequence>
        </fo:root>
    </xsl:template>
    <xsl:template name="shooter">
        <xsl:param name="position"/>
        <fo:block margin-left="0.2mm">
            <xsl:for-each select="$position">
                <xsl:choose>
                    <xsl:when test="mat:pen/text()='true'">
                        <xsl:if test="mat:s/text()!=0">
                            <fo:inline-container inline-progression-dimension="25%" font-size="2.3mm" width="2.7mm" height="2.7mm" text-align="center">
                                <xsl:choose>
                                    <xsl:when test="mat:sub/text() = 'true'">
                                        <fo:block border="0.4mm solid red" padding="0.5mm">
                                            <fo:block border="0.3mm solid black" fox:border-radius="50%">
                                                <xsl:value-of select="mat:s/text()"/>
                                            </fo:block>
                                        </fo:block>
                                    </xsl:when>
                                    <xsl:otherwise>
                                        <fo:block border="0.3mm solid black" fox:border-radius="50%">
                                            <xsl:value-of select="mat:s/text()"/>
                                        </fo:block>
                                    </xsl:otherwise>
                                </xsl:choose>

                            </fo:inline-container>
                        </xsl:if>
                        <xsl:if test="mat:m/text()='true'">
                            <fo:inline-container inline-progression-dimension="25%">
                                <fo:block font-weight="bolder" font-size="2.3mm">
                                    <xsl:if test="mat:sub/text() = 'true'">
                                        <xsl:attribute name="border">0.3mm solid red</xsl:attribute>
                                    </xsl:if>
                                    P
                                </fo:block>
                            </fo:inline-container>
                        </xsl:if>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:if test="mat:s/text()!=0">
                            <fo:inline-container inline-progression-dimension="25%">
                                <fo:block border="none" text-align="center">
                                    <xsl:if test="mat:sub/text() = 'true'">
                                        <xsl:attribute name="border">0.3mm solid red</xsl:attribute>
                                    </xsl:if>
                                    <xsl:value-of select="mat:s/text()"/>
                                </fo:block>
                            </fo:inline-container>
                        </xsl:if>
                        <xsl:if test="mat:m/text()='true'">
                            <fo:inline-container inline-progression-dimension="25%">
                                <fo:block font-weight="bolder" text-align="center">
                                    <xsl:if test="mat:sub/text() = 'true'">
                                        <xsl:attribute name="border">0.3mm solid red</xsl:attribute>
                                    </xsl:if>
                                    &#8226;
                                </fo:block>
                            </fo:inline-container>
                        </xsl:if>
                        <xsl:if test="mat:xsub/text()='true'">
                            <fo:inline-container inline-progression-dimension="25%">
                                <fo:block font-weight="bolder" border="0.3mm solid red" text-align="center">
                                    X
                                </fo:block>
                            </fo:inline-container>
                        </xsl:if>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:for-each>
        </fo:block>
    </xsl:template>
    <xsl:template name="playerDetails">
        <xsl:param name="players"/>
        <xsl:param name="index"/>
        <xsl:param name="maxValue"/>
        <fo:table-row background-color="white" height="5.1mm">
            <fo:table-cell border="0.35mm solid black" display-align="center">
                <fo:block text-align="center">
                    <xsl:value-of select="$index"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell number-columns-spanned="2" border="0.35mm solid black" display-align="center">
                <fo:block-container overflow="hidden" wrap-option="no-wrap">
                    <fo:block margin-left="0.5mm">
                        <xsl:if test="$players[$index]">
                            <xsl:value-of select="upper-case($players[$index]/mat:lastName/text())"/>,
                            <xsl:value-of select="$players[$index]/mat:firstName/text()"/>
                        </xsl:if>
                        <fo:leader/>
                    </fo:block>
                </fo:block-container>
            </fo:table-cell>
            <fo:table-cell border="0.35mm solid black" display-align="center">
                <fo:block text-align="center" font-size="6pt">
                    <xsl:value-of select="$players[$index]/mat:pPos[1]/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="0.35mm solid black" display-align="center">
                <fo:block text-align="center" font-size="6pt">
                    <xsl:value-of select="$players[$index]/mat:pPos[2]/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="0.35mm solid black" display-align="center">
                <fo:block text-align="center" font-size="6pt">
                    <xsl:value-of select="$players[$index]/mat:pPos[3]/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="0.35mm solid black" display-align="center">
                <fo:block text-align="center" font-size="6pt">
                    <xsl:value-of select="$players[$index]/mat:pPos[4]/text()"/>
                </fo:block>
            </fo:table-cell>
        </fo:table-row>
        <xsl:if test="$index &lt; $maxValue">
            <xsl:call-template name="playerDetails">
                <xsl:with-param name="index" select="$index + 1"/>
                <xsl:with-param name="maxValue" select="$maxValue"/>
                <xsl:with-param name="players" select="$players"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    <xsl:template name="prdStat">
        <xsl:param name="periods"/>
        <xsl:param name="index"/>
        <xsl:param name="entries"/>
        <xsl:param name="label"/>
        <xsl:param name="thick"/>
        <xsl:param name="score"/>
        <fo:table-row background-color="white" border="inherit" height="5.25mm">
            <xsl:for-each select="$periods">
                <xsl:if test="($index = 1) and ($thick)">
                    <xsl:copy>
                        <xsl:attribute name="border-top">
                            0.35mm solid black
                        </xsl:attribute>
                    </xsl:copy>
                </xsl:if>
                <xsl:choose>
                    <xsl:when test="$index = 2">
                        <xsl:copy>
                            <xsl:attribute name="height">4.95mm</xsl:attribute>
                        </xsl:copy>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:copy>
                            <xsl:attribute name="height">5.25mm</xsl:attribute>
                        </xsl:copy>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="$index = 1">
                    <fo:table-cell border="inherit" border-left="0.35mm solid black" border-right="0.35mm solid black"
                                   number-rows-spanned="2" display-align="center">
                        <xsl:attribute name="number-rows-spanned">
                            <xsl:value-of select="$entries"/>
                        </xsl:attribute>
                        <fo:block text-align="center">
                            <xsl:value-of select="$label"/>
                        </fo:block>
                    </fo:table-cell>
                </xsl:if>
                <fo:table-cell border="inherit" display-align="center">
                    <fo:block text-align="center">
                        <xsl:choose>
                            <xsl:when test="$score">
                                <xsl:value-of select="mat:ihQGSS[$index]/text()"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:value-of select="mat:ihQGSA[$index]/text()"/>
                            </xsl:otherwise>
                        </xsl:choose>
                    </fo:block>
                </fo:table-cell>
                <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center">
                    <fo:block text-align="center">
                        <xsl:choose>
                            <xsl:when test="$score">
                                <xsl:value-of select="mat:ihQGAS[$index]/text()"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:value-of select="mat:ihQGAA[$index]/text()"/>
                            </xsl:otherwise>
                        </xsl:choose>
                    </fo:block>
                </fo:table-cell>
                <fo:table-cell border="inherit" display-align="center">
                    <fo:block text-align="center">
                        <xsl:choose>
                            <xsl:when test="$score">
                                <xsl:value-of select="mat:iaQGSS[$index]/text()"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:value-of select="mat:iaQGSA[$index]/text()"/>
                            </xsl:otherwise>
                        </xsl:choose>
                    </fo:block>
                </fo:table-cell>
                <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center">
                    <fo:block text-align="center">
                        <xsl:choose>
                            <xsl:when test="$score">
                                <xsl:value-of select="mat:iaQGAS[$index]/text()"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:value-of select="mat:iaQGAA[$index]/text()"/>
                            </xsl:otherwise>
                        </xsl:choose>
                    </fo:block>
                </fo:table-cell>
            </xsl:for-each>
        </fo:table-row>

        <xsl:if test="$index &lt; $entries">
            <xsl:call-template name="prdStat">
                <xsl:with-param name="periods" select="$periods"/>
                <xsl:with-param name="index" select="$index + 1"/>
                <xsl:with-param name="entries" select="$entries"/>
                <xsl:with-param name="label" select="$label"/>
                <xsl:with-param name="thick" select="$thick"/>
                <xsl:with-param name="score" select="$score"/>
            </xsl:call-template>
        </xsl:if>

    </xsl:template>
    <xsl:template name="prdScore">
        <xsl:param name="home"/>
        <xsl:param name="away"/>
        <xsl:param name="label"/>


        <xsl:choose>
            <xsl:when test="$label = 'Q.Scr.'">
                <xsl:copy>
                    <xsl:attribute name="border-top">0.35mm solid black</xsl:attribute>
                </xsl:copy>
            </xsl:when>
        </xsl:choose>
        <fo:table-cell border="inherit" border-left="0.35mm solid black" border-right="0.35mm solid black"
                       display-align="center">
            <fo:block text-align="center">
                <xsl:choose>
                    <xsl:when test="$label = 'Prog. Scr'">
                        <xsl:attribute name="font-size">6.5pt</xsl:attribute>
                    </xsl:when>
                </xsl:choose>
                <xsl:value-of select="$label"/>
            </fo:block>
        </fo:table-cell>
        <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center"
                       number-columns-spanned="2">
            <fo:block text-align="center">
                <xsl:value-of select="$home"/>
            </fo:block>
        </fo:table-cell>
        <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center"
                       number-columns-spanned="2">
            <fo:block text-align="center">
                <xsl:value-of select="$away"/>
            </fo:block>
        </fo:table-cell>
    </xsl:template>
    <xsl:template name="plyrStat">
        <xsl:param name="periods"/>
        <xsl:param name="index"/>
        <xsl:param name="entries"/>
        <xsl:param name="hplayers"/>
        <xsl:param name="aplayers"/>
        <xsl:param name="shooters"/>

        <fo:table-row background-color="white" border="inherit" height="5.25mm">
            <!--            <xsl:for-each select="$periods">-->

            <fo:table-cell border="inherit" border-left="0.35mm solid black" number-rows-spanned="2" display-align="center">
                <fo:block text-align="center">
                    <xsl:value-of select="$shooters/mat:h/mat:gs[$index]/@id"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" display-align="center" number-columns-spanned="2">
                <fo:block text-align="left" margin-left="1mm">
                    Attempts
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center" number-columns-spanned="2">
                <fo:block text-align="center">
                    <xsl:value-of select="key('hplayerlookup', $shooters/mat:h/mat:gs[$index]/text())/mat:positionScore/mat:gsAttempts/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-left="0.35mm solid black" number-rows-spanned="2" display-align="center">
                <fo:block text-align="center">
                    <xsl:value-of select="$shooters/mat:h/mat:ga[$index]/@id"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" display-align="center" number-columns-spanned="2">
                <fo:block text-align="left" margin-left="1mm">
                    Attempts
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center" number-columns-spanned="2">
                <fo:block text-align="center">
                    <xsl:value-of select="key('hplayerlookup', $shooters/mat:h/mat:ga[$index]/text())/mat:positionScore/mat:gaAttempts/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-left="0.35mm solid black" number-rows-spanned="2" display-align="center">
                <fo:block text-align="center">
                    <xsl:value-of select="$shooters/mat:a/mat:gs[$index]/@id"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" display-align="center" number-columns-spanned="2">
                <fo:block text-align="left" margin-left="1mm">
                    Attempts
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center" number-columns-spanned="2">
                <fo:block text-align="center">
                    <xsl:value-of select="key('aplayerlookup', $shooters/mat:a/mat:gs[$index]/text())/mat:positionScore/mat:gsAttempts/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-left="0.35mm solid black" number-rows-spanned="2" display-align="center">
                <fo:block text-align="center">
                    <xsl:value-of select="$shooters/mat:a/mat:ga[$index]/@id"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" display-align="center" number-columns-spanned="2">
                <fo:block text-align="left" margin-left="1mm">
                    Attempts
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center" number-columns-spanned="2">
                <fo:block text-align="center">
                    <xsl:value-of select="key('aplayerlookup', $shooters/mat:a/mat:ga[$index]/text())/mat:positionScore/mat:gaAttempts/text()"/>
                </fo:block>
            </fo:table-cell>
            <!--            </xsl:for-each>-->
        </fo:table-row>
        <fo:table-row background-color="white" border="inherit" height="5.25mm">
            <fo:table-cell border="inherit" display-align="center" number-columns-spanned="2">
                <fo:block text-align="left" margin-left="1mm">
                    Scored
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center" number-columns-spanned="2">
                <fo:block text-align="center">
                    <xsl:value-of select="key('hplayerlookup', $shooters/mat:h/mat:gs[$index]/text())/mat:positionScore/mat:gsScore/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" display-align="center" number-columns-spanned="2">
                <fo:block text-align="left" margin-left="1mm">
                    Scored
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center" number-columns-spanned="2">
                <fo:block text-align="center">
                    <xsl:value-of select="key('hplayerlookup', $shooters/mat:h/mat:ga[$index]/text())/mat:positionScore/mat:gaScore/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" display-align="center" number-columns-spanned="2">
                <fo:block text-align="left" margin-left="1mm">
                    Scored
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center" number-columns-spanned="2">
                <fo:block text-align="center">
                    <xsl:value-of select="key('aplayerlookup', $shooters/mat:a/mat:gs[$index]/text())/mat:positionScore/mat:gsScore/text()"/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" display-align="center" number-columns-spanned="2">
                <fo:block text-align="left" margin-left="1mm">
                    Scored
                </fo:block>
            </fo:table-cell>
            <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center" number-columns-spanned="2">
                <fo:block text-align="center">
                    <xsl:value-of select="key('aplayerlookup', $shooters/mat:a/mat:ga[$index]/text())/mat:positionScore/mat:gaScore/text()"/>
                </fo:block>
            </fo:table-cell>
        </fo:table-row>

        <xsl:if test="$index &lt; $entries">
            <xsl:call-template name="plyrStat">
                <xsl:with-param name="periods" select="$periods"/>
                <xsl:with-param name="index" select="$index + 1"/>
                <xsl:with-param name="entries" select="$entries"/>
                <xsl:with-param name="hplayers" select="$hplayers"/>
                <xsl:with-param name="aplayers" select="$aplayers"/>
                <xsl:with-param name="shooters" select="$shooters"/>

            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    <xsl:template name="periodTable">
        <xsl:param name="periods"/>
        <xsl:param name="maxQShooters"/>
        <xsl:param name="maxGShooters"/>
        <fo:table table-layout="fixed" width="168mm" font-size="60%" text-align="left" margin-top="0" margin-bottom="0"
                  border-collapse="collapse" padding="0"
                  background-color="black">
            <xsl:for-each select="$periods">
                <fo:table-column column-width="10mm" margin="0"/>
                <fo:table-column column-width="8mm" margin="0"/>
                <fo:table-column column-width="8mm" margin="0"/>
                <fo:table-column column-width="8mm" margin="0"/>
                <fo:table-column column-width="8mm" margin="0"/>
            </xsl:for-each>
            <fo:table-body border="0.2mm solid black" border-right="none">
                <fo:table-row background-color="white" border="inherit" height="5.25mm">
                    <xsl:for-each select="$periods">
                        <fo:table-cell number-columns-spanned="5" display-align="center" border="0.35mm solid black">
                            <fo:block text-align="center" font-weight="bold">
                                <xsl:choose>
                                    <xsl:when test="position()=1">First Quarter</xsl:when>
                                    <xsl:when test="position()=2">Second Quarter</xsl:when>
                                    <xsl:when test="position()=3">Third Quarter</xsl:when>
                                    <xsl:when test="position()=4">Fourth Quarter</xsl:when>
                                </xsl:choose>
                            </fo:block>
                        </fo:table-cell>
                    </xsl:for-each>
                </fo:table-row>
                <fo:table-row background-color="white" border="inherit" height="5.25mm">
                    <xsl:for-each select="$periods">
                        <fo:table-cell number-rows-spanned="2" border="inherit" border-left="0.35mm solid black"
                                       border-right="0.35mm solid black" display-align="center">
                            <fo:block text-align="center" font-weight="bold">
                                Ctr Pass
                            </fo:block>
                        </fo:table-cell>
                        <fo:table-cell number-columns-spanned="2" border="inherit" border-right="0.35mm solid black"
                                       display-align="center" border-left="0.35mm solid black">
                            <fo:block text-align="center" font-weight="bold">
                                Team 1
                            </fo:block>
                        </fo:table-cell>
                        <fo:table-cell number-columns-spanned="2" border="inherit" border-right="0.35mm solid black"
                                       display-align="center" border-left="0.35mm solid black">
                            <fo:block text-align="center" font-weight="bold">
                                Team 2
                            </fo:block>
                        </fo:table-cell>
                    </xsl:for-each>
                </fo:table-row>
                <fo:table-row background-color="white" border="inherit" height="5.25mm">
                    <xsl:for-each select="$periods">
                        <fo:table-cell border="inherit" display-align="center" border-left="0.35mm solid black">
                            <fo:block text-align="center" font-weight="bold">
                                GS
                            </fo:block>
                        </fo:table-cell>
                        <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center">
                            <fo:block text-align="center" font-weight="bold">
                                GA
                            </fo:block>
                        </fo:table-cell>
                        <fo:table-cell border="inherit" display-align="center" border-left="0.35mm solid black">
                            <fo:block text-align="center" font-weight="bold">
                                GS
                            </fo:block>
                        </fo:table-cell>
                        <fo:table-cell border="inherit" border-right="0.35mm solid black" display-align="center">
                            <fo:block text-align="center" font-weight="bold">
                                GA
                            </fo:block>
                        </fo:table-cell>
                    </xsl:for-each>
                </fo:table-row>
                <xsl:call-template name="cp">
                    <xsl:with-param name="periods" select="$periods"/>
                    <xsl:with-param name="last" select="false()"/>
                    <xsl:with-param name="index" select="1"/>
                    <xsl:with-param name="maxValue" select="$cps"/>
                </xsl:call-template>

                <xsl:call-template name="prdStat">
                    <xsl:with-param name="label" select="'Att.'"/>
                    <xsl:with-param name="index" select="1"/>
                    <xsl:with-param name="entries" select="$maxQShooters"/>
                    <xsl:with-param name="thick" select="true()"/>
                    <xsl:with-param name="periods" select="$periods"/>
                    <xsl:with-param name="score" select="false()"/>
                </xsl:call-template>

                <xsl:call-template name="prdStat">
                    <xsl:with-param name="label" select="'Scrd.'"/>
                    <xsl:with-param name="index" select="1"/>
                    <xsl:with-param name="entries" select="$maxQShooters"/>
                    <xsl:with-param name="thick" select="false()"/>
                    <xsl:with-param name="periods" select="$periods"/>
                    <xsl:with-param name="score" select="true()"/>
                </xsl:call-template>

                <fo:table-row background-color="white" border="inherit" height="5.25mm">
                    <xsl:for-each select="$periods">
                        <xsl:call-template name="prdScore">
                            <xsl:with-param name="label" select="'Q.Scr.'"/>
                            <xsl:with-param name="home" select="number(mat:hQGSS/text()) + number(mat:hQGAS/text())"/>
                            <xsl:with-param name="away" select="number(mat:aQGSS/text()) + number(mat:aQGAS/text())"/>
                        </xsl:call-template>
                    </xsl:for-each>
                </fo:table-row>
                <fo:table-row background-color="white" border="inherit" height="5.25mm">
                    <xsl:for-each select="$periods">
                        <xsl:call-template name="prdScore">
                            <xsl:with-param name="label" select="'Prog. Scr'"/>
                            <xsl:with-param name="home" select="number(mat:hProg/text())"/>
                            <xsl:with-param name="away" select="number(mat:aProg/text())"/>
                        </xsl:call-template>
                    </xsl:for-each>
                </fo:table-row>

                <fo:table-row background-color="white" border="none" height="4.95mm">
                    <xsl:for-each select="$periods">
                        <xsl:if test="position() mod 2 = 1">
                            <fo:table-cell border="0.35mm solid black" display-align="center" number-columns-spanned="10">
                                <fo:block text-align="left" font-weight="bold" margin-left="5mm">
                                    <xsl:choose>
                                        <xsl:when test="position() = 1">Team 1:
                                            <fo:inline font-size="6pt" font-weight="normal">
                                                <xsl:value-of select="/mat:matchsummary/mat:homeTeam/mat:name/text()"/>
                                            </fo:inline>
                                        </xsl:when>
                                        <xsl:when test="position() = 3">Team 2:
                                            <fo:inline font-size="6pt" font-weight="normal">
                                                <xsl:value-of select="/mat:matchsummary/mat:awayTeam/mat:name/text()"/>
                                            </fo:inline>
                                        </xsl:when>
                                    </xsl:choose>
                                </fo:block>
                            </fo:table-cell>
                        </xsl:if>
                    </xsl:for-each>
                </fo:table-row>
                <fo:table-row background-color="white" border="inherit" height="4.95mm">
                    <xsl:for-each select="$periods">
                        <fo:table-cell border="0.35mm solid black" display-align="center"
                                       number-columns-spanned="5">
                            <fo:block text-align="center" font-weight="bold">
                                <xsl:choose>
                                    <xsl:when test="position() mod 2 = 1">
                                        Goal Shoot
                                    </xsl:when>
                                    <xsl:when test="position() mod 2 = 0">
                                        Goal Attack
                                    </xsl:when>
                                </xsl:choose>
                            </fo:block>
                        </fo:table-cell>
                    </xsl:for-each>
                </fo:table-row>

                <xsl:call-template name="plyrStat">
                    <xsl:with-param name="periods" select="$periods"/>
                    <xsl:with-param name="index" select="1"/>
                    <xsl:with-param name="entries" select="$maxGShooters"/>
                    <xsl:with-param name="hplayers" select="/mat:matchsummary/mat:scoresheet/mat:hScores"/>
                    <xsl:with-param name="aplayers" select="/mat:matchsummary/mat:scoresheet/mat:aScores"/>
                    <xsl:with-param name="shooters" select="/mat:matchsummary/mat:scoresheet/mat:shooters"/>
                </xsl:call-template>

                <fo:table-row background-color="white" border="none" height="5.3mm">
                    <xsl:for-each select="$periods">
                        <xsl:if test="position() mod 2 = 1">
                            <fo:table-cell border="0.35mm solid black" display-align="center" number-columns-spanned="10">
                                <fo:block text-align="left" font-weight="bold" margin-left="5mm">
                                    <xsl:choose>
                                        <xsl:when test="position() = 1">MATCH WON BY:
                                            <fo:inline font-weight="normal">
                                                <xsl:call-template name="result">
                                                    <xsl:with-param name="homeScore" select="/mat:matchsummary/mat:homeTeam/mat:scoreTotal"/>
                                                    <xsl:with-param name="awayScore" select="/mat:matchsummary/mat:awayTeam/mat:scoreTotal"/>
                                                    <xsl:with-param name="awayTeam" select="/mat:matchsummary/mat:awayTeam"/>
                                                    <xsl:with-param name="homeTeam" select="/mat:matchsummary/mat:homeTeam"/>
                                                </xsl:call-template>
                                            </fo:inline>
                                        </xsl:when>
                                        <xsl:when test="position() = 3">FINAL SCORE:
                                            <fo:inline font-weight="normal">
                                                <xsl:call-template name="finalScore">
                                                    <xsl:with-param name="homeScore" select="/mat:matchsummary/mat:homeTeam/mat:scoreTotal"/>
                                                    <xsl:with-param name="awayScore" select="/mat:matchsummary/mat:awayTeam/mat:scoreTotal"/>
                                                </xsl:call-template>
                                            </fo:inline>
                                        </xsl:when>
                                    </xsl:choose>
                                </fo:block>
                            </fo:table-cell>
                        </xsl:if>
                    </xsl:for-each>
                </fo:table-row>
                <fo:table-row background-color="white" border="none" height="5.3mm">
                    <fo:table-cell border="0.35mm solid black" display-align="center">
                        <xsl:attribute name="number-columns-spanned">
                            <xsl:value-of select="count($periods) * 5"/>
                        </xsl:attribute>
                        <fo:block text-align="left" font-weight="bold" margin-left="5mm">
                            PLAYER OF THE MATCH:
                            <fo:inline font-weight="normal">
                                <xsl:value-of select="/mat:matchsummary/mat:info/mat:potm/text()"/>
                            </fo:inline>
                        </fo:block>
                    </fo:table-cell>
                </fo:table-row>

                <fo:table-row background-color="white" border="none" height="5.25mm">
                    <xsl:for-each select="$periods">
                        <xsl:if test="position() mod 2 = 1">
                            <fo:table-cell border="0.35mm solid black" display-align="center" number-columns-spanned="10">
                                <fo:block text-align="left" font-weight="bold" font-size="7pt">
                                    <xsl:choose>
                                        <xsl:when test="position() = 1">SCORER 1:
                                            <fo:inline font-weight="normal">
                                                <xsl:value-of select="/mat:matchsummary/mat:info/mat:scorers[1]/mat:name/text()"/>
                                            </fo:inline>
                                        </xsl:when>
                                        <xsl:when test="position() = 3">TIMER 1:
                                            <fo:inline font-weight="normal">
                                                <xsl:value-of select="/mat:matchsummary/mat:info/mat:timers[1]/mat:name/text()"/>
                                            </fo:inline>
                                        </xsl:when>
                                    </xsl:choose>
                                </fo:block>
                            </fo:table-cell>
                        </xsl:if>
                    </xsl:for-each>
                </fo:table-row>
                <fo:table-row background-color="white" border="none" height="5.25mm">
                    <xsl:for-each select="$periods">
                        <xsl:if test="position() mod 2 = 1">
                            <fo:table-cell border="0.35mm solid black" display-align="center" number-columns-spanned="10">
                                <fo:block text-align="left" font-weight="bold" font-size="7pt">
                                    <xsl:choose>
                                        <xsl:when test="position() = 1">SCORER 2:
                                            <fo:inline font-weight="normal">
                                                <xsl:value-of select="/mat:matchsummary/mat:info/mat:scorers[2]/mat:name/text()"/>
                                            </fo:inline>
                                        </xsl:when>
                                        <xsl:when test="position() = 3">TIMER 2:
                                            <fo:inline font-weight="normal">
                                                <xsl:value-of select="/mat:matchsummary/mat:info/mat:timers[2]/mat:name/text()"/>
                                            </fo:inline>
                                        </xsl:when>
                                    </xsl:choose>
                                </fo:block>
                            </fo:table-cell>
                        </xsl:if>
                    </xsl:for-each>
                </fo:table-row>
            </fo:table-body>
        </fo:table>
    </xsl:template>
    <xsl:template name="cp">
        <xsl:param name="periods"/>
        <xsl:param name="index"/>
        <xsl:param name="maxValue"/>
        <xsl:param name="last"/>
        <fo:table-row background-color="white" border="inherit" height="5.25mm" font-size="85%">
            <xsl:for-each select="$periods">
                <xsl:variable name="fcp" select="mat:cp[1]/mat:t/text()"/>
                <xsl:if test="$last">
                    <xsl:copy>
                        <xsl:attribute name="height">
                            4.85mm
                        </xsl:attribute>
                    </xsl:copy>
                </xsl:if>
                <fo:table-cell border="inherit" border-left="0.35mm solid black" border-right="0.35mm solid black"
                               display-align="center">
                    <fo:block margin-left="0.5mm" margin-right="0.5mm">
                        <xsl:choose>
                            <xsl:when test="mat:cp[$index]/mat:t/text() = $fcp">
                                <xsl:attribute name="text-align">left</xsl:attribute>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:attribute name="text-align">right</xsl:attribute>
                            </xsl:otherwise>
                        </xsl:choose>
                        <xsl:value-of select="mat:cp[$index]/mat:t/text()"/>
                        <xsl:if test="not(mat:cp)">
                            <fo:leader/>
                        </xsl:if>
                    </fo:block>
                </fo:table-cell>
                <fo:table-cell border="inherit" display-align="center" border-left="0.35mm solid black">
                    <fo:block-container height="4.15mm" margin="0.1mm">
                        <xsl:if test="mat:cp[$index]/mat:hts/mat:gsEndPeriodSub/text() = 'true'">
                            <xsl:attribute name="border">0.4mm solid red</xsl:attribute>
                        </xsl:if>
                        <xsl:call-template name="shooter">
                            <xsl:with-param name="position" select="mat:cp[$index]/mat:hts/mat:gs"/>
                        </xsl:call-template>
                    </fo:block-container>
                </fo:table-cell>
                <fo:table-cell border="inherit" display-align="center" border-right="0.35mm solid black">
                    <fo:block-container height="4.15mm" margin="0.1mm">
                        <xsl:if test="mat:cp[$index]/mat:hts/mat:gaEndPeriodSub/text() = 'true'">
                            <xsl:attribute name="border">0.4mm solid red</xsl:attribute>
                        </xsl:if>
                        <xsl:call-template name="shooter">
                            <xsl:with-param name="position" select="mat:cp[$index]/mat:hts/mat:ga"/>
                        </xsl:call-template>
                    </fo:block-container>
                </fo:table-cell>
                <fo:table-cell border="inherit" display-align="center" border-left="0.35mm solid black">
                    <fo:block-container height="4.15mm" margin="0.1mm">
                        <xsl:if test="mat:cp[$index]/mat:ats/mat:gsEndPeriodSub/text() = 'true'">
                            <xsl:attribute name="border">0.4mm solid red</xsl:attribute>
                        </xsl:if>
                        <xsl:call-template name="shooter">
                            <xsl:with-param name="position" select="mat:cp[$index]/mat:ats/mat:gs"/>
                        </xsl:call-template>
                    </fo:block-container>
                </fo:table-cell>
                <fo:table-cell border="inherit" display-align="center" border-right="0.35mm solid black">
                    <fo:block-container height="4.15mm" margin="0.1mm">
                        <xsl:if test="mat:cp[$index]/mat:ats/mat:gaEndPeriodSub/text() = 'true'">
                            <xsl:attribute name="border">0.4mm solid red</xsl:attribute>
                        </xsl:if>
                        <xsl:call-template name="shooter">
                            <xsl:with-param name="position" select="mat:cp[$index]/mat:ats/mat:ga"/>
                        </xsl:call-template>
                    </fo:block-container>
                </fo:table-cell>
            </xsl:for-each>
        </fo:table-row>


        <xsl:if test="$index &lt; $maxValue">
            <xsl:call-template name="cp">
                <xsl:with-param name="index" select="$index + 1"/>
                <xsl:with-param name="maxValue" select="$maxValue"/>
                <xsl:with-param name="last" select="$index + 1 = $maxValue"/>
                <xsl:with-param name="periods" select="$periods"/>
            </xsl:call-template>
        </xsl:if>

    </xsl:template>
    <xsl:template name="finalScore">
        <xsl:param name="homeScore"/>
        <xsl:param name="awayScore"/>

        <xsl:choose>
            <xsl:when test="$homeScore &gt; $awayScore">
                <xsl:value-of select="$homeScore"/> -
                <xsl:value-of select="$awayScore"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$awayScore"/> -
                <xsl:value-of select="$homeScore"/>
            </xsl:otherwise>
        </xsl:choose>

    </xsl:template>
    <xsl:template name="result">
        <xsl:param name="homeScore"/>
        <xsl:param name="awayScore"/>
        <xsl:param name="homeTeam"/>
        <xsl:param name="awayTeam"/>
        <xsl:choose>
            <xsl:when test="$homeScore &gt; $awayScore">
                <xsl:value-of select="$homeTeam/mat:name/text()"/>
            </xsl:when>
            <xsl:when test="$homeScore &lt; $awayScore">
                <xsl:value-of select="$awayTeam/mat:name/text()"/>
            </xsl:when>
            <xsl:otherwise>Draw
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template name="captain">
        <xsl:param name="team"/>
        <xsl:variable name="captain" select="($team/mat:players[mat:captainRole/text()='CAPTAIN'])[1]"/>
        <xsl:if test="$captain">
            <xsl:value-of select="upper-case($captain/mat:lastName/text())"/>,
            <xsl:value-of select="$captain/mat:firstName/text()"/>
        </xsl:if>
    </xsl:template>

    <xsl:template name="ruler">
        <xsl:param name="periods"/>
        <xsl:param name="index"/>
        <xsl:param name="entries"/>
        <xsl:variable name="activeRows"  select="count($periods[$index]/mat:cp[string-length(mat:t/text()) > 0])"/>
        <xsl:variable name="lastRow"
                      select="number(not(boolean($periods[$index]/mat:cp[$activeRows]/mat:ats/node()) or boolean($periods[$index]/mat:cp[$activeRows]/mat:hts/node()))) * 0.5"/>
        <fo:block-container absolute-position="absolute">
            <xsl:attribute name="top"><xsl:value-of select="19.45 + (($activeRows - $lastRow) * 5.45)"/>mm
            </xsl:attribute>
            <xsl:attribute name="left"><xsl:value-of select="85 + (($index - 1) * 42)"/>mm
            </xsl:attribute>
            <fo:block>
                <!--                <xsl:value-of select="$lastRow"></xsl:value-of>-->
                <fo:external-graphic src="url('https://nbscore.blackberryconsulting.com.au/images/horiz.svg')" width="32mm" height="200mm" content-width="scale-to-fit" scaling="non-uniform"/>
            </fo:block>
        </fo:block-container>
        <fo:block-container absolute-position="absolute">
            <xsl:attribute name="top"><xsl:value-of select="19.45 + (($activeRows - $lastRow) * 5.45)"/>mm
            </xsl:attribute>
            <xsl:attribute name="left"><xsl:value-of select="85 + (($index - 1) * 42)"/>mm
            </xsl:attribute>
            <fo:block>
                <fo:external-graphic src="url('https://nbscore.blackberryconsulting.com.au/images/diag.svg')" width="32mm" content-height="scale-to-fit" scaling="non-uniform">
                    <xsl:attribute name="height">
                        <xsl:value-of select="($cps - $activeRows + $lastRow) * 5.45"/>mm
                    </xsl:attribute>
                </fo:external-graphic>
            </fo:block>
        </fo:block-container>

        <xsl:if test="$index &lt; $entries">
            <xsl:call-template name="ruler">
                <xsl:with-param name="index" select="$index + 1"/>
                <xsl:with-param name="entries" select="$entries"/>
                <xsl:with-param name="periods" select="$periods"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>

    <xsl:template name="teamDetails">
        <xsl:param name="team"/>
        <fo:table-row height="5.1mm">
            <fo:table-cell number-columns-spanned="2" border="0.35mm solid black" display-align="center">
                <fo:block text-align="left" margin-left="0.5mm">
                    Captain:
                </fo:block>
            </fo:table-cell>
            <fo:table-cell number-columns-spanned="5" border="0.35mm solid black" display-align="center">
                <fo:block margin-left="0.5mm">
                    <xsl:call-template name="captain">
                        <xsl:with-param name="team" select="$team"/>
                    </xsl:call-template>
                </fo:block>
            </fo:table-cell>
        </fo:table-row>
        <fo:table-row height="5.1mm">
            <fo:table-cell number-columns-spanned="2" border="0.35mm solid black" display-align="center">
                <fo:block text-align="left" margin-left="0.5mm">
                    Head Coach
                </fo:block>
            </fo:table-cell>
            <fo:table-cell number-columns-spanned="5" border="0.35mm solid black" display-align="center">
                <fo:block margin-left="0.5mm">
                    <xsl:value-of select="$team/mat:support[mat:role/text() = 'coach'][1]/mat:name/text()"/>
                </fo:block>
            </fo:table-cell>
        </fo:table-row>
        <fo:table-row height="5.1mm">
            <fo:table-cell number-columns-spanned="2" border="0.35mm solid black" display-align="center">
                <fo:block text-align="left" margin-left="0.5mm">
                    Assistant Coach
                </fo:block>
            </fo:table-cell>
            <fo:table-cell number-columns-spanned="5" border="0.35mm solid black" display-align="center">
                <fo:block margin-left="0.5mm">
                    <xsl:value-of select="$team/mat:support[mat:role/text() = 'a-coach'][1]/mat:name/text()"/>
                </fo:block>
            </fo:table-cell>
        </fo:table-row>
        <fo:table-row height="5.1mm">
            <fo:table-cell number-columns-spanned="2" border="0.35mm solid black" display-align="center">
                <fo:block text-align="left" margin-left="0.5mm">
                    Manager
                </fo:block>
            </fo:table-cell>
            <fo:table-cell number-columns-spanned="5" border="0.35mm solid black" display-align="center">
                <fo:block margin-left="0.5mm">
                    <xsl:value-of select="$team/mat:support[mat:role/text() = 'manager'][1]/mat:name/text()"/>
                </fo:block>
            </fo:table-cell>
        </fo:table-row>
        <fo:table-row height="5.1mm">
            <fo:table-cell number-columns-spanned="2" border="0.35mm solid black" display-align="center">
                <fo:block text-align="left" margin-left="0.5mm">
                    Primary Carer
                </fo:block>
            </fo:table-cell>
            <fo:table-cell number-columns-spanned="5" border="0.35mm solid black" display-align="center">
                <fo:block margin-left="0.5mm">
                    <xsl:value-of select="$team/mat:support[mat:role/text() = 'primarycare'][1]/mat:name/text()"/>
                </fo:block>
            </fo:table-cell>
        </fo:table-row>
        <fo:table-row height="5.1mm">
            <fo:table-cell number-columns-spanned="2" border="0.35mm solid black" display-align="center">
                <fo:block text-align="center">
                    <fo:leader/>
                </fo:block>
            </fo:table-cell>
            <fo:table-cell number-columns-spanned="5" border="0.35mm solid black" display-align="center">
                <fo:block>
                    <fo:leader/>
                </fo:block>
            </fo:table-cell>
        </fo:table-row>
    </xsl:template>


    <xsl:key name="playerlookup" match="/mat:matchsummary/mat:homeTeam/mat:players" use="mat:id/text()"/>
    <xsl:key name="hplayerlookup" match="mat:hScores" use="mat:pid/text()"/>
    <xsl:key name="aplayerlookup" match="mat:aScores" use="mat:pid/text()"/>

</xsl:stylesheet>
