<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/">
        <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
            <fo:layout-master-set>
                <fo:simple-page-master master-name="first-page"
                                       page-width="210mm" page-height="297mm"
                                       margin-top="20mm" margin-bottom="55mm" margin-left="20mm" margin-right="20mm">
                    <fo:region-body/>
                    <fo:region-before extent="30mm"/>
                    <fo:region-after region-name="xsl-region-after-first"/>
                </fo:simple-page-master>

                <!-- Layout for subsequent pages -->
                <fo:simple-page-master master-name="rest-pages"
                                       page-width="210mm" page-height="297mm"
                                       margin-top="20mm" margin-bottom="10mm" margin-left="20mm" margin-right="20mm">
                    <fo:region-body margin-bottom="12mm" margin-top="10mm"/>
                    <fo:region-before extent="30mm" region-name="xsl-region-before-rest"/>
                    <fo:region-after extent="10mm"/>
                </fo:simple-page-master>

                <!-- Page sequence master to apply different layouts -->
                <fo:page-sequence-master master-name="document-master">
                    <fo:repeatable-page-master-alternatives>
                        <fo:conditional-page-master-reference master-reference="first-page" page-position="first"/>
                        <fo:conditional-page-master-reference master-reference="rest-pages" page-position="rest"/>
                    </fo:repeatable-page-master-alternatives>
                </fo:page-sequence-master>

            </fo:layout-master-set>
            <fo:page-sequence master-reference="document-master">
                <fo:static-content flow-name="xsl-region-before-rest">
                    <fo:block font-size="10pt">
                        <fo:external-graphic
                                src="url('https://logo.blacksaltit.com.au/RedLogo/05_Png_TransparentBG/HorizontalLogo/BlackSaltIT_Red_Horizontal_TransparentBG.png')"
                                content-width="33mm"/>
                    </fo:block>
                </fo:static-content>
                <fo:static-content flow-name="xsl-region-after-first">
                    <fo:block font-size="10pt" border-top="1px dashed #000000">
                        <fo:table space-before="10mm">
                            <fo:table-column column-width="60%"/>
                            <fo:table-column column-width="40%"/>
                            <fo:table-body>
                                <fo:table-row>
                                    <fo:table-cell>
                                        <fo:block font-size="16pt" space-before="5mm">PAYMENT ADVICE</fo:block>
                                        <fo:block font-weight="bold">Black Salt IT Pty Ltd</fo:block>
                                        <fo:block>30 Richings Dr</fo:block>
                                        <fo:block>YOUNGTOWN TAS 7249</fo:block>
                                        <fo:block>
                                            <fo:inline font-weight="bold">e:</fo:inline>
                                            accounts@blacksaltit.com.au
                                        </fo:block>
                                        <fo:block>
                                            <fo:inline font-weight="bold">p:</fo:inline>
                                            (03) 6335 9797
                                        </fo:block>
                                    </fo:table-cell>
                                    <fo:table-cell>
                                        <fo:block font-weight="bold" space-before="5mm">Bank Transfer:</fo:block>
                                        <fo:block>Commonwealth Bank of Australia</fo:block>
                                        <fo:block>
                                            <fo:inline font-weight="bold">BSB:</fo:inline>
                                            067 - 873
                                        </fo:block>
                                        <fo:block>
                                            <fo:inline font-weight="bold">Account:</fo:inline>
                                            1151 0069
                                        </fo:block>
                                        <fo:block space-before="3mm">
                                            <fo:inline font-weight="bold">Reference:</fo:inline>
                                            <xsl:text> </xsl:text>
                                            <xsl:value-of select="/Invoice/invoiceId"/>
                                        </fo:block>
                                        <fo:block>
                                            <fo:inline font-weight="bold">Amount Due:</fo:inline>
                                            <xsl:text> </xsl:text>
                                            $<xsl:value-of select="format-number(Invoice/totalDue, '#,##0.00')"/>
                                        </fo:block>
                                        <fo:block>
                                            <fo:inline font-weight="bold">Due Date:</fo:inline>
                                            <xsl:text> </xsl:text>
                                            <xsl:value-of select="/Invoice/dueDate"/>
                                        </fo:block>
                                    </fo:table-cell>
                                </fo:table-row>
                            </fo:table-body>
                        </fo:table>
                    </fo:block>
                </fo:static-content>
                <fo:static-content flow-name="xsl-region-after">
                    <fo:block font-size="10pt" background-color="#333333" padding="2mm" space-before="5mm" text-align="center">
                        <fo:block text-align="center" font-size="7pt" color="#ffffff">
                            ABN: 63 660 450 564. Registered Office: 30 Richings Dr, YOUNGTOWN, TAS, 7249, Australia.
                        </fo:block>
                    </fo:block>
                </fo:static-content>
                <fo:flow flow-name="xsl-region-body" font-family="Raleway">
                    <fo:table table-layout="fixed" width="100%">
                        <fo:table-column column-width="70mm"/>
                        <fo:table-column column-width="40mm"/>
                        <fo:table-column column-width="60mm"/>

                        <fo:table-body>
                            <fo:table-row>
                                <fo:table-cell>
                                    <fo:block>
                                        <fo:block font-size="16pt" font-weight="bold" text-align="left" space-after="5mm">
                                            TAX INVOICE
                                        </fo:block>
                                        <fo:block font-size="14pt" space-after="1mm">
                                            <fo:inline font-weight="bold">
                                                <xsl:value-of select="Invoice/tenant/name"/>
                                            </fo:inline>
                                        </fo:block>
                                        <fo:block font-size="11pt" space-after="10mm">
                                            <fo:block>
                                                <xsl:value-of select="Invoice/tenant/address1"/>
                                            </fo:block>
                                            <fo:block>
                                                <xsl:value-of select="Invoice/tenant/address2"/>
                                            </fo:block>
                                            <fo:block>
                                                <xsl:value-of select="upper-case(Invoice/tenant/city)"/>,
                                                <xsl:value-of select="upper-case(Invoice/tenant/state)"/>,
                                                <xsl:value-of select="Invoice/tenant/postcode"/>
                                            </fo:block>
                                            <fo:block font-size="10pt" space-before="7mm">
                                                <fo:inline font-weight="bold" padding-right="1mm">Invoice Period:</fo:inline>
                                                <xsl:value-of select="Invoice/periodStartDate"/> -
                                                <xsl:value-of select="Invoice/periodEndDate"/>
                                            </fo:block>
                                        </fo:block>
                                    </fo:block>
                                </fo:table-cell>

                                <fo:table-cell>
                                    <fo:block>
                                        <!-- Spacer -->
                                    </fo:block>
                                </fo:table-cell>

                                <fo:table-cell padding-left="12mm">
                                    <fo:block max-width="55mm">
                                        <fo:block>
                                            <fo:block space-after="1mm" text-align="left">
                                                <fo:external-graphic
                                                        src="url('https://logo.blacksaltit.com.au/RedLogo/05_Png_TransparentBG/StackedLogo/BlackSaltIT_Red_Stacked_TransparentBG.png')"
                                                        content-width="33mm"/>
                                            </fo:block>
                                            <fo:block text-align="left" font-size="9pt" font-weight="bold" space-after="5mm">
                                                ABN: 63 660 450 564
                                            </fo:block>

                                            <!-- Invoice Details -->
                                            <fo:block font-size="10pt" space-after="1mm">
                                                <fo:inline font-weight="bold" padding-right="1mm">Invoice Number:</fo:inline>
                                                <xsl:value-of select="Invoice/invoiceId"/>
                                            </fo:block>
                                        </fo:block>
                                        <fo:block font-size="10pt" space-after="2mm">
                                            <fo:block font-size="10pt" space-after="1mm">
                                                <fo:inline font-weight="bold" padding-right="1mm">Invoice Date:</fo:inline>
                                                <xsl:value-of select="Invoice/invoiceDate"/>
                                            </fo:block>
                                            <fo:block font-size="10pt">
                                                <fo:inline font-weight="bold" padding-right="1mm">Due Date:</fo:inline>
                                                <xsl:value-of select="Invoice/dueDate"/>
                                            </fo:block>
                                        </fo:block>
                                    </fo:block>


                                </fo:table-cell>
                            </fo:table-row>
                            <fo:table-row>
                                <fo:table-cell padding-top="5mm">
                                    <fo:block space-before="5mm">
                                        <xsl:if test="Invoice/overdueIncGst != '0.00'">
                                            <fo:block>
                                                <fo:block font-size="14pt" font-weight="bold" text-align="center" background-color="#ed1c24" color="#ffffff"
                                                          padding="2mm">
                                                    <fo:block font-size="10pt">Overdue Amount:</fo:block>
                                                    <fo:block text-align="center" space-before="1mm">$<xsl:value-of
                                                            select="format-number(Invoice/overdueIncGst, '#,##0.00')"/>
                                                    </fo:block>
                                                </fo:block>
                                            </fo:block>
                                        </xsl:if>
                                    </fo:block>
                                </fo:table-cell>
                                <fo:table-cell>
                                    <fo:block>
                                        <!-- Spacer -->
                                    </fo:block>
                                </fo:table-cell>
                                <fo:table-cell text-align="center" padding="5mm">
                                    <fo:block space-before="5mm">
                                        <fo:block font-size="14pt" font-weight="bold" background-color="#000000" color="#ffffff" padding="2mm">
                                            <fo:block font-size="10pt">Amount Due (AUD)</fo:block>
                                            <fo:block text-align="center" space-before="1mm">$<xsl:value-of
                                                    select="format-number(Invoice/totalDue, '#,##0.00')"/>
                                            </fo:block>
                                        </fo:block>
                                        <xsl:if test="Invoice/overdueIncGst != '0.00'">
                                            <fo:block font-size="10pt" space-before="1mm">
                                                New Charges: $<xsl:value-of select="format-number(Invoice/totalIncGst, '#,##0.00')"/>
                                            </fo:block>
                                        </xsl:if>
                                    </fo:block>
                                </fo:table-cell>
                            </fo:table-row>
                        </fo:table-body>
                    </fo:table>


                    <fo:block font-size="16pt" font-weight="bold" space-before="10mm">
                        Service Summary
                    </fo:block>

                    <!-- Line Items Table -->
                    <xsl:for-each select="Invoice/data">
                        <fo:table table-layout="fixed" width="100%" space-after="2mm" space-before="10mm" font-size="9pt">
                            <fo:table-column column-width="140mm"/>
                            <fo:table-column column-width="30mm"/>
                            <fo:table-body>
                                <fo:table-row border-after-color="#000000" border-after-style="solid" border-after-width="1px" background-color="#f0f0f0"
                                              border-before-color="#000000" border-before-style="solid" border-before-width="1px">
                                    <fo:table-cell padding="2mm">
                                        <fo:block>
                                            <fo:block font-weight="bold">
                                                <fo:inline>
                                                    <xsl:value-of select="site/name"/>
                                                </fo:inline>
                                            </fo:block>
                                            <fo:block font-size="9pt">
                                                <xsl:value-of select="site/address"/>,
                                                <xsl:if test="site/address2 and normalize-space(site/address2) != '' and site/address2 != 'null'">
                                                    <xsl:value-of select="site/address2"/>,
                                                </xsl:if>
                                                <xsl:value-of select="site/city"/>
                                                <xsl:text> </xsl:text>
                                                <xsl:value-of select="site/state"/>
                                                <xsl:text> </xsl:text>
                                                <xsl:value-of select="site/postcode"/>
                                            </fo:block>
                                        </fo:block>
                                    </fo:table-cell>
                                    <fo:table-cell padding="2mm">
                                        <fo:block text-align="right" font-weight="bold" font-size="10pt">
                                            <fo:inline>
                                                $
                                                <xsl:value-of select="siteTotal"/>
                                            </fo:inline>
                                        </fo:block>
                                    </fo:table-cell>
                                </fo:table-row>
                            </fo:table-body>
                        </fo:table>

                        <xsl:for-each select="assets">
                            <fo:block font-style="italic" font-size="10pt" space-before="1mm" space-after="1mm">
                                <fo:inline font-family="MaterialIcons" font-size="14pt" color="#444444">&#xe328;</fo:inline>
                                <xsl:text> </xsl:text>
                                <fo:inline font-weight="bold">
                                    <xsl:value-of select="asset/hostname"/>
                                </fo:inline>
                                -
                                <xsl:value-of select="asset/routerDetails/model"/>
                            </fo:block>
                            <fo:table table-layout="fixed" width="100%" space-after="2mm" font-size="9pt">
                                <fo:table-column column-width="20mm"/>
                                <fo:table-column column-width="3mm"/>
                                <fo:table-column column-width="30mm"/>
                                <fo:table-column column-width="95mm"/>
                                <fo:table-column column-width="20mm"/>
                                <fo:table-body>
                                    <xsl:for-each select="events">
                                        <xsl:if test="eventType = 'ACTIVATED'">
                                            <fo:table-row>
                                                <fo:table-cell padding="1pt">
                                                    <fo:block>
                                                        <xsl:choose>
                                                            <xsl:when test="../wasActive = 'true' and position() = 1">
                                                                <xsl:value-of select="/Invoice/periodStartDate"/>
                                                            </xsl:when>
                                                            <xsl:otherwise>
                                                                <xsl:value-of select="timestamp"/>
                                                            </xsl:otherwise>
                                                        </xsl:choose>
                                                    </fo:block>
                                                </fo:table-cell>
                                                <fo:table-cell text-align="center">
                                                    <fo:block>
                                                        -
                                                    </fo:block>
                                                </fo:table-cell>
                                                <fo:table-cell padding="1pt">
                                                    <fo:block>
                                                        <xsl:value-of select="until"/>
                                                    </fo:block>
                                                </fo:table-cell>
                                                <fo:table-cell padding="1pt">
                                                    <fo:block>
                                                        <xsl:choose>
                                                            <xsl:when test="eventType = 'ACTIVATED'">
                                                                <xsl:value-of select="rate/name"/>
                                                            </xsl:when>
                                                            <xsl:when test="eventType = 'DEACTIVATED'">
                                                            </xsl:when>
                                                        </xsl:choose>
                                                    </fo:block>
                                                </fo:table-cell>
                                                <fo:table-cell padding="1pt">
                                                    <fo:block text-align="right">
                                                        <xsl:if test="billingAmount != 'undefined'">
                                                            <fo:inline>$</fo:inline>
                                                            <fo:inline-container width="100%">
                                                                <fo:block-container text-align="right">
                                                                    <fo:block>
                                                                        <xsl:value-of select="format-number(billingAmount, '#,##0.00')"/>
                                                                    </fo:block>
                                                                </fo:block-container>
                                                            </fo:inline-container>
                                                        </xsl:if>
                                                    </fo:block>
                                                </fo:table-cell>
                                            </fo:table-row>
                                        </xsl:if>
                                    </xsl:for-each>

<!--                                    <fo:table-row>-->
<!--                                        <fo:table-cell number-columns-spanned="4" padding="1pt">-->
<!--                                            <fo:block text-align="right" font-weight="bold" margin-right="5pt">-->
<!--                                                <fo:inline-container width="100%">-->
<!--                                                    <fo:block-container text-align="right">-->
<!--                                                        <fo:block>Asset Total:</fo:block>-->
<!--                                                    </fo:block-container>-->
<!--                                                </fo:inline-container>-->
<!--                                            </fo:block>-->
<!--                                        </fo:table-cell>-->
<!--                                        <fo:table-cell padding="1pt" border-before-color="black" border-before-style="solid" border-before-width="1px"-->
<!--                                                       border-after-color="black"-->
<!--                                                       border-after-style="double" border-after-width="3px">-->
<!--                                            <fo:block text-align="right" font-weight="bold">-->
<!--                                                <fo:inline>$</fo:inline>-->
<!--                                                <fo:inline-container width="100%">-->
<!--                                                    <fo:block-container text-align="right">-->
<!--                                                        <fo:block>-->
<!--                                                            <xsl:value-of select="format-number(billingAmount, '#,##0.00')"/>-->
<!--                                                        </fo:block>-->
<!--                                                    </fo:block-container>-->
<!--                                                </fo:inline-container>-->
<!--                                            </fo:block>-->
<!--                                        </fo:table-cell>-->
<!--                                    </fo:table-row>-->
                                </fo:table-body>
                            </fo:table>
                        </xsl:for-each>


                    </xsl:for-each>
                    <!-- Invoice Totals -->
                    <fo:table table-layout="fixed" width="100%">
                        <fo:table-column column-width="100mm"/>
                        <fo:table-column column-width="45mm"/>
                        <fo:table-column column-width="25mm"/>


                        <fo:table-body font-size="10pt">
                            <fo:table-row>
                                <fo:table-cell>
                                    <fo:block>
                                    </fo:block>
                                </fo:table-cell>
                                <fo:table-cell>
                                    <fo:block>
                                        <fo:block font-size="11pt" font-weight="bold" space-before="10mm">
                                            Subtotal:
                                        </fo:block>
                                    </fo:block>
                                </fo:table-cell>
                                <fo:table-cell>
                                    <fo:block text-align="right">
                                        <fo:inline>$</fo:inline>
                                        <fo:inline-container width="100%">
                                            <fo:block-container text-align="right">
                                                <fo:block>
                                                    <xsl:value-of select="format-number(Invoice/totalExGst, '#,##0.00')"/>
                                                </fo:block>
                                            </fo:block-container>
                                        </fo:inline-container>
                                    </fo:block>
                                </fo:table-cell>
                            </fo:table-row>

                            <fo:table-row>
                                <fo:table-cell>
                                    <fo:block>
                                    </fo:block>
                                </fo:table-cell>
                                <fo:table-cell>
                                    <fo:block>
                                        <fo:block font-size="11pt" font-weight="bold">
                                            Total GST (10%):
                                        </fo:block>
                                    </fo:block>
                                </fo:table-cell>
                                <fo:table-cell>
                                    <fo:block text-align="right">
                                        <fo:inline>$</fo:inline>
                                        <fo:inline-container width="100%">
                                            <fo:block-container text-align="right">
                                                <fo:block>
                                                    <xsl:value-of select="format-number(Invoice/gst, '#,##0.00')"/>
                                                </fo:block>
                                            </fo:block-container>
                                        </fo:inline-container>
                                    </fo:block>
                                </fo:table-cell>
                            </fo:table-row>
                            <fo:table-row>
                                <fo:table-cell>
                                    <fo:block>
                                    </fo:block>
                                </fo:table-cell>
                                <fo:table-cell>
                                    <fo:block>
                                        <fo:block font-size="11pt" font-weight="bold">
                                            Invoice Total (AUD):
                                        </fo:block>
                                    </fo:block>
                                </fo:table-cell>
                                <fo:table-cell border-before-color="black" border-before-style="solid" border-before-width="1px" border-after-color="black"
                                               border-after-style="double" border-after-width="3px">
                                    <fo:block text-align="right">
                                        <fo:inline>$</fo:inline>
                                        <fo:inline-container width="100%">
                                            <fo:block-container text-align="right">
                                                <fo:block>
                                                    <xsl:value-of select="format-number(Invoice/totalIncGst, '#,##0.00')"/>
                                                </fo:block>
                                            </fo:block-container>
                                        </fo:inline-container>
                                    </fo:block>
                                </fo:table-cell>
                            </fo:table-row>
                        </fo:table-body>
                    </fo:table>

                    <fo:block break-before="page">
                        <xsl:variable name="matching-rows" select="//data/assets[wasActive='true' and count (events) = 1]"/>
                        <xsl:variable name="total-assets" select="count(//data/assets)"/>
                        <xsl:variable name="matching-assets" select="count($matching-rows)"/>

                        <fo:block font-size="16pt" font-weight="bold">
                            Services - On &amp; Off
                        </fo:block>

                        <xsl:if test="$total-assets = $matching-assets">
                            No On/Off changes in this billing period.
                        </xsl:if>


                        <xsl:if test="$total-assets != $matching-assets">
                            <fo:table table-layout="fixed" width="100%" space-after="5mm" font-size="9pt">
                                <fo:table-column column-width="6mm"/>
                                <fo:table-column column-width="30mm"/>
                                <fo:table-column column-width="67mm"/>
                                <fo:table-column column-width="67mm"/>
                                <fo:table-header>
                                    <fo:table-row font-weight="bold">
                                        <fo:table-cell padding="1pt">
                                            <fo:block></fo:block>
                                        </fo:table-cell>
                                        <fo:table-cell padding="1pt">
                                            <fo:block>Date</fo:block>
                                        </fo:table-cell>
                                        <fo:table-cell padding="1pt">
                                            <fo:block>Site</fo:block>
                                        </fo:table-cell>
                                        <fo:table-cell padding="1pt">
                                            <fo:block>Asset</fo:block>
                                        </fo:table-cell>

                                    </fo:table-row>
                                </fo:table-header>
                                <fo:table-body>
                                    <xsl:for-each select="Invoice/data">
                                        <xsl:for-each select="assets">
                                            <xsl:for-each select="events">
                                                <xsl:if test="../wasActive = 'false' or position() > 1">
                                                    <fo:table-row display-align="center">
                                                        <fo:table-cell padding="1pt">
                                                            <fo:block>
                                                                <xsl:choose>
                                                                    <xsl:when test="eventType = 'ACTIVATED' and position() = 1 and ../wasActive = 'false'">
                                                                        <fo:block font-family="MaterialIcons" font-size="14pt" color="#4CAF50">
                                                                            &#xe147;
                                                                        </fo:block>
                                                                    </xsl:when>
                                                                    <xsl:when test="eventType = 'ACTIVATED' and (position() > 1 or ../wasActive = 'false')">
                                                                        <fo:block font-family="MaterialIcons" font-size="14pt" color="#4CAF50">
                                                                            &#xe147;
                                                                        </fo:block>
                                                                    </xsl:when>
                                                                    <xsl:when test="eventType = 'DEACTIVATED'">
                                                                        <fo:block font-family="MaterialIcons" font-size="14pt" color="#C44D58">
                                                                            &#xe5c9;
                                                                        </fo:block>
                                                                    </xsl:when>
                                                                    <xsl:otherwise>
                                                                        <fo:block>?</fo:block>
                                                                    </xsl:otherwise>
                                                                </xsl:choose>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell padding="1pt">
                                                            <fo:block>
                                                                <xsl:value-of select="timestamp"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell padding="1pt">
                                                            <fo:block>
                                                                <xsl:value-of select="../../site/name"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                        <fo:table-cell padding="1pt">
                                                            <fo:block>
                                                                <xsl:value-of select="../asset/hostname"/>
                                                            </fo:block>
                                                        </fo:table-cell>
                                                    </fo:table-row>
                                                </xsl:if>

                                            </xsl:for-each>
                                        </xsl:for-each>
                                    </xsl:for-each>
                                </fo:table-body>
                            </fo:table>
                        </xsl:if>
                    </fo:block>
                </fo:flow>
            </fo:page-sequence>
        </fo:root>
    </xsl:template>
</xsl:stylesheet>
