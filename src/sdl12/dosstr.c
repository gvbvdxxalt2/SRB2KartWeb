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

#ifdef EMSCRIPTEN
char *strupr(char *n)
{
	char *s = n;
	while (*s != '\0')
	{
		*s = toupper((unsigned char)*s);
		s++;
	}
	return n;
}

char *strlwr(char *n)
{
	char *s = n;
	while (*s != '\0')
	{
		*s = tolower((unsigned char)*s);
		s++;
	}
	return n;
}
#else
int strupr(char *n)
{
	while (*n != '\0')
	{
		*n = toupper((unsigned char)*n);
		n++;
	}
	return 1;
}

int strlwr(char *n)
{
	while (*n != '\0')
	{
		*n = tolower((unsigned char)*n);
		n++;
	}
	return 1;
}
#endif

#endif
