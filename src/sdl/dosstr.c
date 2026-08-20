// Emacs style mode select   -*- C++ -*-
//-----------------------------------------------------------------------------
//
// This file is in the public domain.
// (Re)written by Graue in 2006.
//
//-----------------------------------------------------------------------------
/// \file
/// \brief String uppercasing/lowercasing functions for non-DOS non-Win32
///        systems

#include "../doomtype.h"

#ifndef HAVE_DOSSTR_FUNCS

#include <ctype.h>


char *strupr(char *n)
{
    char *p = n;
    while (*p != '\0')
    {
        *p = toupper((unsigned char)*p);
        p++;
    }
    return n;
}

char *strlwr(char *n)
{
    char *p = n;
    while (*p != '\0')
    {
        *p = tolower((unsigned char)*p);
        p++;
    }
    return n;
}

#endif